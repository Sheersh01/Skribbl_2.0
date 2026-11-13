export interface Avatar {
  /** Index into AVATAR_COLORS. */
  color: number;
  /** Index into the face variants (see AVATAR_FACES). */
  face: number;
}

export interface Settings {
  rounds: number;
  /** Seconds per drawing turn. */
  drawTime: number;
  /** How many words the drawer chooses from. */
  wordChoices: number;
  /** Letters revealed during a turn. */
  hints: number;
  maxPlayers: number;
  customWords: string[];
  /** Use only the custom words (ignore the built-in list). */
  customOnly: boolean;
}

/**
 * lobby -> choosing -> drawing -> turnEnd -> (next turn: choosing ...) -> gameEnd -> lobby
 */
export type Phase = 'lobby' | 'choosing' | 'drawing' | 'turnEnd' | 'gameEnd';

export interface PlayerInfo {
  id: string;
  name: string;
  avatar: Avatar;
  score: number;
  connected: boolean;
  /** Guessed the word this turn. */
  guessed: boolean;
}

export interface TurnInfo {
  /** Increments every turn; clients clear the canvas when it changes. */
  id: number;
  round: number;
  drawerId: string;
  /** Milliseconds left in the current phase (choosing / drawing / turnEnd). */
  endsIn: number;
  /** The word with hidden letters as "_" (spaces and punctuation shown). Null while choosing. */
  hint: string | null;
  /** The full word, only if you may see it (drawer, already guessed, or turn over). */
  word: string | null;
  /** Drawer only, while choosing. */
  wordChoices: string[] | null;
}

export type TurnEndReason = 'allGuessed' | 'timeUp' | 'drawerLeft';

export interface TurnResult {
  word: string;
  reason: TurnEndReason;
  /** Points gained this turn, by player id. */
  points: Record<string, number>;
}

/** What a client sees about a room. Built per player, so it never leaks the word. */
export interface RoomState {
  code: string;
  phase: Phase;
  hostId: string | null;
  players: PlayerInfo[];
  settings: Settings;
  turn: TurnInfo | null;
  result: TurnResult | null;
}

/**
 * chat     – normal message, everyone sees it
 * guessed  – from someone who already guessed; only drawer + other guessers see it
 * correct  – "X guessed the word!"
 * close    – private "'xyz' is close!" nudge
 * system   – game announcements
 */
export type ChatKind = 'chat' | 'guessed' | 'correct' | 'close' | 'system';

export interface ChatMessage {
  id: number;
  kind: ChatKind;
  playerId?: string;
  name?: string;
  text: string;
}

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export interface JoinInfo {
  code: string;
  playerId: string;
  sessionId: string;
}

export interface Profile {
  name: string;
  avatar: Avatar;
}
