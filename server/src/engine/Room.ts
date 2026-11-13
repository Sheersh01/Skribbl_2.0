import { randomBytes } from 'node:crypto';
import {
  CHAT_BURST,
  CHAT_MAX_LENGTH,
  CHAT_WINDOW_MS,
  CHOOSE_TIME_MS,
  CUSTOM_ONLY_MIN_WORDS,
  DEFAULT_SETTINGS,
  DrawingBoard,
  TURN_END_MS,
  sanitizeSettings,
  type Avatar,
  type ChatKind,
  type ChatMessage,
  type Phase,
  type PlayerInfo,
  type Result,
  type RoomState,
  type Settings,
  type TurnEndReason,
  type TurnInfo,
  type TurnResult,
} from '@skribbl/shared';
import { isCloseGuess, isCorrectGuess } from './guess';
import { hintSchedule, maskWord, pickHintIndex } from './hints';
import { drawerPoints, guesserPoints } from './scoring';
import { EN_WORDS, pickWords } from './words';

/** How long a disconnected player keeps their slot and score. */
export const RECONNECT_GRACE_MS = 60_000;

export interface RoomHooks {
  /** Something visible changed; send each player their own view (toState(playerId)). */
  onChange(room: Room): void;
  /** The last player is gone; the room can be deleted. */
  onEmpty(room: Room): void;
  /** Deliver a chat message to everyone, or only to the listed player ids. */
  onChat(room: Room, msg: ChatMessage, to?: string[]): void;
}

export interface RoomOptions {
  words?: readonly string[];
  random?: () => number;
}

interface PlayerRecord {
  id: string;
  sessionId: string;
  name: string;
  avatar: Avatar;
  score: number;
  connected: boolean;
  /** Timestamps of recent chat messages, for the spam limit. */
  recentChats: number[];
  removeTimer?: ReturnType<typeof setTimeout>;
}

const newId = (bytes: number) => randomBytes(bytes).toString('base64url');
// Control characters (C0, DEL, C1).
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

/**
 * One game room. Pure game logic: knows nothing about sockets. The socket
 * layer calls these methods and delivers whatever the hooks emit.
 */
export class Room {
  phase: Phase = 'lobby';
  hostId: string | null = null;
  settings: Settings = { ...DEFAULT_SETTINGS };
  readonly board = new DrawingBoard();
  private players: PlayerRecord[] = [];

  // ---- game state (secret parts never leave via toState unless allowed) ----
  private round = 0;
  private turnId = 0;
  private drawerId: string | null = null;
  private wordChoices: string[] | null = null;
  private word: string | null = null;
  private revealed = new Set<number>();
  /** playerId -> points earned this turn by guessing. Insertion order = guess order. */
  private guessed = new Map<string, number>();
  private drawnThisRound = new Set<string>();
  private usedWords = new Set<string>();
  private result: TurnResult | null = null;
  private phaseEndsAt = 0;
  private phaseTimer?: ReturnType<typeof setTimeout>;
  private hintTimers: ReturnType<typeof setTimeout>[] = [];
  private msgId = 0;

  private readonly builtInWords: readonly string[];
  private readonly random: () => number;

  constructor(
    readonly code: string,
    private readonly hooks: RoomHooks,
    options: RoomOptions = {},
  ) {
    this.builtInWords = options.words ?? EN_WORDS;
    this.random = options.random ?? Math.random;
  }

  // =========================================================================
  // Membership
  // =========================================================================

  addPlayer(name: string, avatar: Avatar): Result<{ player: PlayerInfo; sessionId: string }> {
    if (this.players.length >= this.settings.maxPlayers) return { ok: false, error: 'This room is full.' };

    const player: PlayerRecord = {
      id: newId(8),
      sessionId: newId(18),
      name,
      avatar,
      score: 0,
      connected: true,
      recentChats: [],
    };
    this.players.push(player);
    if (!this.getConnected(this.hostId)) this.hostId = player.id;
    this.system(`${name} joined.`);
    this.hooks.onChange(this);
    return { ok: true, player: this.toInfo(player), sessionId: player.sessionId };
  }

  /** Reclaims a slot after a refresh or dropped connection. */
  reconnect(sessionId: string): PlayerInfo | null {
    const p = this.players.find((x) => x.sessionId === sessionId);
    if (!p) return null;
    clearTimeout(p.removeTimer);
    p.removeTimer = undefined;
    p.connected = true;
    if (!this.getConnected(this.hostId)) this.hostId = p.id;
    this.hooks.onChange(this);
    return this.toInfo(p);
  }

  /** Connection dropped: keep the slot for RECONNECT_GRACE_MS. */
  disconnect(playerId: string): void {
    const p = this.find(playerId);
    if (!p || !p.connected) return;
    p.connected = false;
    p.removeTimer = setTimeout(() => this.remove(playerId, 'left'), RECONNECT_GRACE_MS);
    if (this.hostId === playerId) this.transferHost();
    this.afterPlayerGone(p);
    this.hooks.onChange(this);
  }

  /** Player chose to leave: remove right away. */
  leave(playerId: string): void {
    this.remove(playerId, 'left');
  }

  kick(byId: string, targetId: string): Result {
    if (byId !== this.hostId) return { ok: false, error: 'Only the host can kick.' };
    if (byId === targetId) return { ok: false, error: "You can't kick yourself." };
    if (!this.find(targetId)) return { ok: false, error: 'No such player.' };
    this.remove(targetId, 'kicked');
    return { ok: true };
  }

  private remove(playerId: string, why: 'left' | 'kicked'): void {
    const i = this.players.findIndex((x) => x.id === playerId);
    if (i === -1) return;
    const [p] = this.players.splice(i, 1);
    clearTimeout(p.removeTimer);

    if (this.players.length === 0) {
      this.clearTimers();
      this.hostId = null;
      this.hooks.onEmpty(this);
      return;
    }
    if (this.hostId === playerId) this.transferHost();
    this.system(why === 'kicked' ? `${p.name} was kicked.` : `${p.name} left.`);

    if (this.inGame() && this.players.length < 2) {
      this.resetToLobby('Not enough players — back to the lobby.');
      return;
    }
    this.afterPlayerGone(p);
    this.hooks.onChange(this);
  }

  /** Turn bookkeeping when a player disconnects or is removed. */
  private afterPlayerGone(p: PlayerRecord): void {
    if (p.id === this.drawerId) {
      if (this.phase === 'choosing') {
        this.system(`${p.name} is gone — skipping their turn.`);
        this.nextTurn();
      } else if (this.phase === 'drawing') {
        this.endTurn('drawerLeft');
      }
    } else if (this.phase === 'drawing' && this.allGuessed()) {
      this.endTurn('allGuessed');
    }
  }

  /** Host goes to the earliest-joined connected player (if any). */
  private transferHost(): void {
    const next = this.players.find((x) => x.connected && x.id !== this.hostId);
    if (next) this.hostId = next.id;
    else if (!this.find(this.hostId)) this.hostId = this.players[0]?.id ?? null;
  }

  // =========================================================================
  // Host actions
  // =========================================================================

  updateSettings(byId: string, patch: unknown): Result {
    if (byId !== this.hostId) return { ok: false, error: 'Only the host can change settings.' };
    if (this.phase !== 'lobby') return { ok: false, error: 'Settings are locked during a game.' };
    this.settings = sanitizeSettings(patch, this.settings, this.players.length);
    this.hooks.onChange(this);
    return { ok: true };
  }

  start(byId: string): Result {
    if (byId !== this.hostId) return { ok: false, error: 'Only the host can start the game.' };
    if (this.phase !== 'lobby') return { ok: false, error: 'The game already started.' };
    if (this.connectedCount() < 2) return { ok: false, error: 'You need at least 2 players.' };
    if (this.settings.customOnly && this.settings.customWords.length < CUSTOM_ONLY_MIN_WORDS) {
      return { ok: false, error: `Add at least ${CUSTOM_ONLY_MIN_WORDS} custom words, or turn off "custom words only".` };
    }
    for (const p of this.players) p.score = 0;
    this.round = 1;
    this.drawnThisRound.clear();
    this.usedWords.clear();
    this.system(`Round 1 of ${this.settings.rounds}`);
    this.nextTurn();
    return { ok: true };
  }

  /** Host sends everyone back to the lobby (mid-game, or from the podium). */
  endGame(byId: string): Result {
    if (byId !== this.hostId) return { ok: false, error: 'Only the host can end the game.' };
    if (this.phase === 'lobby') return { ok: true };
    this.resetToLobby(this.phase === 'gameEnd' ? null : 'The host ended the game.');
    return { ok: true };
  }

  private resetToLobby(message: string | null): void {
    this.clearTimers();
    this.phase = 'lobby';
    this.drawerId = null;
    this.word = null;
    this.wordChoices = null;
    this.result = null;
    this.guessed.clear();
    this.revealed.clear();
    this.board.reset();
    if (message) this.system(message);
    this.hooks.onChange(this);
  }

  // =========================================================================
  // Turn engine
  // =========================================================================

  private nextTurn(): void {
    this.clearTimers();
    this.board.reset();
    this.guessed.clear();
    this.revealed.clear();
    this.word = null;
    this.wordChoices = null;
    this.result = null;

    let drawer = this.pickNextDrawer();
    if (!drawer) {
      this.round++;
      this.drawnThisRound.clear();
      if (this.round > this.settings.rounds) return this.finishGame();
      this.system(`Round ${this.round} of ${this.settings.rounds}`);
      drawer = this.pickNextDrawer();
      if (!drawer) return this.finishGame();
    }

    this.turnId++;
    this.drawerId = drawer.id;
    this.drawnThisRound.add(drawer.id);
    this.wordChoices = pickWords(this.wordPool(), this.settings.wordChoices, this.usedWords, this.random);
    this.phase = 'choosing';
    const drawerId = drawer.id;
    this.setPhaseTimer(CHOOSE_TIME_MS, () => {
      const n = this.wordChoices?.length ?? 0;
      if (!this.chooseWord(drawerId, Math.floor(this.random() * n)).ok) this.nextTurn();
    });
    this.system(`${drawer.name} is choosing a word…`);
    this.hooks.onChange(this);
  }

  chooseWord(byId: string, index: number): Result {
    if (this.phase !== 'choosing' || byId !== this.drawerId || !this.wordChoices) {
      return { ok: false, error: "It's not your turn to choose." };
    }
    if (!Number.isInteger(index) || index < 0 || index >= this.wordChoices.length) {
      return { ok: false, error: 'Invalid choice.' };
    }
    const word = this.wordChoices[index];
    this.word = word;
    this.usedWords.add(word);
    this.wordChoices = null;
    this.phase = 'drawing';

    const drawTimeMs = this.settings.drawTime * 1000;
    this.setPhaseTimer(drawTimeMs, () => this.endTurn('timeUp'));
    for (const at of hintSchedule(drawTimeMs, this.settings.hints, word)) {
      this.hintTimers.push(setTimeout(() => this.revealHint(), at));
    }

    this.system(`${this.find(byId)?.name ?? 'Someone'} is drawing now!`);
    this.hooks.onChange(this);
    return { ok: true };
  }

  private revealHint(): void {
    if (this.phase !== 'drawing' || !this.word) return;
    const i = pickHintIndex(this.word, this.revealed, this.random);
    if (i === null) return;
    this.revealed.add(i);
    this.hooks.onChange(this);
  }

  private endTurn(reason: TurnEndReason): void {
    if (this.phase !== 'drawing' || !this.word) return;
    this.clearTimers();

    const points: Record<string, number> = {};
    for (const p of this.players) points[p.id] = this.guessed.get(p.id) ?? 0;

    const drawer = this.find(this.drawerId);
    if (drawer && reason !== 'drawerLeft') {
      // Everyone who could have guessed: still connected, or guessed before leaving.
      const eligible = new Set(this.guessed.keys());
      for (const p of this.players) if (p.connected && p.id !== drawer.id) eligible.add(p.id);
      const dp = drawerPoints(this.guessed.size, eligible.size);
      drawer.score += dp;
      points[drawer.id] = dp;
    }

    this.result = { word: this.word, reason, points };
    this.phase = 'turnEnd';
    this.system(`The word was "${this.word}".`);
    this.setPhaseTimer(TURN_END_MS, () => this.nextTurn());
    this.hooks.onChange(this);
  }

  private finishGame(): void {
    this.clearTimers();
    this.phase = 'gameEnd';
    this.drawerId = null;
    this.word = null;
    this.wordChoices = null;
    this.result = null;
    this.board.reset();
    const winner = [...this.players].sort((a, b) => b.score - a.score)[0];
    this.system(winner ? `Game over! ${winner.name} wins with ${winner.score} points.` : 'Game over!');
    this.hooks.onChange(this);
  }

  // =========================================================================
  // Chat & guessing
  // =========================================================================

  chat(playerId: string, raw: unknown): void {
    const p = this.find(playerId);
    if (!p || typeof raw !== 'string') return;
    const text = raw.replace(CONTROL_CHARS, '').trim().slice(0, CHAT_MAX_LENGTH);
    if (!text) return;

    const now = Date.now();
    p.recentChats = p.recentChats.filter((t) => now - t < CHAT_WINDOW_MS);
    if (p.recentChats.length >= CHAT_BURST) return;
    p.recentChats.push(now);

    const isDrawer = playerId === this.drawerId;
    if (isDrawer && (this.phase === 'choosing' || this.phase === 'drawing')) return; // no hinting in chat

    if (this.phase === 'drawing' && this.word) {
      if (this.guessed.has(playerId)) {
        // Only people who know the word see this.
        this.emitChat('guessed', text, p, [this.drawerId!, ...this.guessed.keys()]);
        return;
      }
      if (isCorrectGuess(text, this.word)) {
        this.correctGuess(p);
        return;
      }
      this.emitChat('chat', text, p);
      if (isCloseGuess(text, this.word)) this.emitChat('close', `'${text}' is close!`, undefined, [p.id]);
      return;
    }

    this.emitChat('chat', text, p);
  }

  private correctGuess(p: PlayerRecord): void {
    const msLeft = Math.max(0, this.phaseEndsAt - Date.now());
    const points = guesserPoints(msLeft, this.settings.drawTime * 1000, this.guessed.size === 0);
    this.guessed.set(p.id, points);
    p.score += points;
    this.emitChat('correct', `${p.name} guessed the word!`, p);

    if (this.allGuessed()) this.endTurn('allGuessed');
    else this.hooks.onChange(this);
  }

  private allGuessed(): boolean {
    const guessers = this.players.filter((p) => p.connected && p.id !== this.drawerId);
    return guessers.length > 0 && guessers.every((p) => this.guessed.has(p.id));
  }

  // =========================================================================
  // Queries
  // =========================================================================

  has(playerId: string | undefined): boolean {
    return !!this.find(playerId);
  }

  playerIds(): string[] {
    return this.players.map((p) => p.id);
  }

  canDraw(playerId: string): boolean {
    return this.phase === 'drawing' && playerId === this.drawerId;
  }

  connectedCount(): number {
    return this.players.filter((p) => p.connected).length;
  }

  /** The room as seen by one player. Secrets are only included when that player may see them. */
  toState(forId?: string): RoomState {
    return {
      code: this.code,
      phase: this.phase,
      hostId: this.hostId,
      players: this.players.map((p) => this.toInfo(p)),
      settings: this.settings,
      turn: this.turnInfo(forId),
      result: this.phase === 'turnEnd' ? this.result : null,
    };
  }

  private turnInfo(forId?: string): TurnInfo | null {
    if (!this.drawerId || !(this.phase === 'choosing' || this.phase === 'drawing' || this.phase === 'turnEnd')) {
      return null;
    }
    const isDrawer = forId === this.drawerId;
    const mayKnow = isDrawer || (forId !== undefined && this.guessed.has(forId)) || this.phase === 'turnEnd';
    return {
      id: this.turnId,
      round: this.round,
      drawerId: this.drawerId,
      endsIn: Math.max(0, this.phaseEndsAt - Date.now()),
      hint: this.word ? maskWord(this.word, this.revealed) : null,
      word: mayKnow ? this.word : null,
      wordChoices: isDrawer && this.phase === 'choosing' ? this.wordChoices : null,
    };
  }

  /** Clears timers; call before throwing the room away. */
  dispose(): void {
    this.clearTimers();
    for (const p of this.players) clearTimeout(p.removeTimer);
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private inGame(): boolean {
    return this.phase === 'choosing' || this.phase === 'drawing' || this.phase === 'turnEnd';
  }

  private pickNextDrawer(): PlayerRecord | undefined {
    return this.players.find((p) => p.connected && !this.drawnThisRound.has(p.id));
  }

  private wordPool(): string[] {
    const custom = this.settings.customWords;
    return this.settings.customOnly ? [...custom] : [...this.builtInWords, ...custom];
  }

  private setPhaseTimer(ms: number, fn: () => void): void {
    clearTimeout(this.phaseTimer);
    this.phaseEndsAt = Date.now() + ms;
    this.phaseTimer = setTimeout(fn, ms);
  }

  private clearTimers(): void {
    clearTimeout(this.phaseTimer);
    this.phaseTimer = undefined;
    for (const t of this.hintTimers) clearTimeout(t);
    this.hintTimers = [];
  }

  private system(text: string): void {
    this.emitChat('system', text);
  }

  private emitChat(kind: ChatKind, text: string, from?: PlayerRecord, to?: string[]): void {
    const msg: ChatMessage = { id: ++this.msgId, kind, text };
    if (from) {
      msg.playerId = from.id;
      msg.name = from.name;
    }
    this.hooks.onChat(this, msg, to ? [...new Set(to)] : undefined);
  }

  private find(id: string | null | undefined) {
    return id ? this.players.find((p) => p.id === id) : undefined;
  }

  private getConnected(id: string | null) {
    const p = this.find(id);
    return p?.connected ? p : undefined;
  }

  private toInfo(p: PlayerRecord): PlayerInfo {
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      connected: p.connected,
      guessed: this.guessed.has(p.id),
    };
  }
}
