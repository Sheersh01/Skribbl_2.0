import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHOOSE_TIME_MS, TURN_END_MS, type ChatMessage } from '@skribbl/shared';
import { RECONNECT_GRACE_MS, Room } from './Room';
import { RoomRegistry, normalizeCode } from './RoomRegistry';

const avatar = { color: 0, face: 0 };
const WORDS = ['apple', 'banana', 'cherry', 'grape', 'lemon', 'mango', 'melon', 'peach', 'plum', 'kiwi'];

function setup() {
  const onChange = vi.fn();
  const onEmpty = vi.fn();
  const chats: { msg: ChatMessage; to?: string[] }[] = [];
  const room = new Room('ABCDE', { onChange, onEmpty, onChat: (_r, msg, to) => chats.push({ msg, to }) }, {
    words: WORDS,
    random: () => 0,
  });
  const add = (name: string) => {
    const r = room.addPlayer(name, avatar);
    if (!r.ok) throw new Error(r.error);
    return r.player.id;
  };
  const addWithSession = (name: string) => {
    const r = room.addPlayer(name, avatar);
    if (!r.ok) throw new Error(r.error);
    return r;
  };
  const state = (id?: string) => room.toState(id);
  /** Start the game and have the drawer pick the first word. Returns the word. */
  const startAndChoose = (hostId: string) => {
    expect(room.start(hostId)).toMatchObject({ ok: true });
    const drawerId = state().turn!.drawerId;
    const word = state(drawerId).turn!.wordChoices![0];
    expect(room.chooseWord(drawerId, 0)).toMatchObject({ ok: true });
    return { drawerId, word };
  };
  return { room, add, addWithSession, onChange, onEmpty, chats, state, startAndChoose };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Room membership', () => {
  it('first player becomes host', () => {
    const { room, add } = setup();
    const a = add('A');
    add('B');
    expect(room.hostId).toBe(a);
  });

  it('rejects joins when full', () => {
    const { room, add } = setup();
    room.settings.maxPlayers = 2;
    add('A');
    add('B');
    expect(room.addPlayer('C', avatar)).toMatchObject({ ok: false });
  });

  it('disconnect keeps the slot, reconnect restores it with the same id', () => {
    const { room, add, addWithSession, state } = setup();
    add('A');
    const b = addWithSession('B');
    room.disconnect(b.player.id);
    expect(state().players[1].connected).toBe(false);

    vi.advanceTimersByTime(RECONNECT_GRACE_MS - 1);
    expect(room.reconnect(b.sessionId)?.id).toBe(b.player.id);
    vi.advanceTimersByTime(RECONNECT_GRACE_MS * 2);
    expect(state().players).toHaveLength(2);
  });

  it('removes a disconnected player after the grace period', () => {
    const { room, add, addWithSession, state } = setup();
    add('A');
    const b = addWithSession('B');
    room.disconnect(b.player.id);
    vi.advanceTimersByTime(RECONNECT_GRACE_MS);
    expect(state().players.map((p) => p.name)).toEqual(['A']);
    expect(room.reconnect(b.sessionId)).toBeNull();
  });

  it('host disconnect hands host to the next connected player', () => {
    const { room, add } = setup();
    const a = add('A');
    const b = add('B');
    room.disconnect(a);
    expect(room.hostId).toBe(b);
  });

  it('last player leaving empties the room', () => {
    const { room, add, onEmpty } = setup();
    const a = add('A');
    const b = add('B');
    room.leave(a);
    expect(room.hostId).toBe(b);
    room.leave(b);
    expect(onEmpty).toHaveBeenCalledOnce();
  });
});

describe('Room host actions', () => {
  it('only the host changes settings, only in the lobby', () => {
    const { room, add } = setup();
    const a = add('A');
    const b = add('B');
    expect(room.updateSettings(b, { rounds: 5 })).toMatchObject({ ok: false });
    expect(room.updateSettings(a, { rounds: 5 })).toMatchObject({ ok: true });
    room.start(a);
    expect(room.updateSettings(a, { rounds: 7 })).toMatchObject({ ok: false });
  });

  it('start needs the host and 2 connected players', () => {
    const { room, add } = setup();
    const a = add('A');
    expect(room.start(a)).toMatchObject({ ok: false });
    const b = add('B');
    expect(room.start(b)).toMatchObject({ ok: false });
    expect(room.start(a)).toMatchObject({ ok: true });
    expect(room.phase).toBe('choosing');
  });

  it('custom-only needs enough custom words', () => {
    const { room, add } = setup();
    const a = add('A');
    add('B');
    room.updateSettings(a, { customOnly: true, customWords: ['cat', 'dog'] });
    expect(room.start(a)).toMatchObject({ ok: false });
  });

  it('kick removes the target; only host may kick', () => {
    const { room, add } = setup();
    const a = add('A');
    const b = add('B');
    expect(room.kick(b, a)).toMatchObject({ ok: false });
    expect(room.kick(a, b)).toMatchObject({ ok: true });
    expect(room.has(b)).toBe(false);
  });
});

describe('Turn engine', () => {
  it('drawer is first in join order and sees the word choices; others do not', () => {
    const { room, add, state } = setup();
    const a = add('A');
    const b = add('B');
    room.start(a);
    expect(state().turn!.drawerId).toBe(a);
    expect(state(a).turn!.wordChoices).toHaveLength(3);
    expect(state(b).turn!.wordChoices).toBeNull();
  });

  it('auto-picks a word when the drawer does not choose in time', () => {
    const { room, add, state } = setup();
    const a = add('A');
    add('B');
    room.start(a);
    vi.advanceTimersByTime(CHOOSE_TIME_MS);
    expect(room.phase).toBe('drawing');
  });

  it('word is hidden from guessers but visible to the drawer', () => {
    const { add, state, startAndChoose } = setup();
    const a = add('A');
    const b = add('B');
    const { word } = startAndChoose(a);
    expect(state(a).turn!.word).toBe(word);
    expect(state(b).turn!.word).toBeNull();
    expect(state(b).turn!.hint).toBe('_'.repeat(word.length));
  });

  it('only the drawer can draw, and only while drawing', () => {
    const { room, add, startAndChoose } = setup();
    const a = add('A');
    const b = add('B');
    expect(room.canDraw(a)).toBe(false);
    startAndChoose(a);
    expect(room.canDraw(a)).toBe(true);
    expect(room.canDraw(b)).toBe(false);
  });

  it('correct guess scores, hides the guess, and reveals the word to the guesser', () => {
    const { room, add, state, chats, startAndChoose } = setup();
    const a = add('A');
    const b = add('B');
    add('C');
    const { word } = startAndChoose(a);

    vi.advanceTimersByTime(10_000);
    room.chat(b, word.toUpperCase());
    const me = state(b).players.find((p) => p.id === b)!;
    expect(me.guessed).toBe(true);
    expect(me.score).toBeGreaterThanOrEqual(250); // fast + first bonus
    expect(state(b).turn!.word).toBe(word);
    // The word itself never went out as a chat message.
    expect(chats.some((c) => c.msg.text.toLowerCase() === word)).toBe(false);
    expect(chats.at(-1)!.msg.kind).toBe('correct');
  });

  it('messages from players who guessed only go to the drawer and other guessers', () => {
    const { room, add, chats, startAndChoose } = setup();
    const a = add('A');
    const b = add('B');
    add('C');
    const { word } = startAndChoose(a);
    room.chat(b, word);
    vi.advanceTimersByTime(1000);
    room.chat(b, 'easy one');
    const last = chats.at(-1)!;
    expect(last.msg.kind).toBe('guessed');
    expect(new Set(last.to)).toEqual(new Set([a, b]));
  });

  it('close guesses get a private nudge', () => {
    const { room, add, chats, startAndChoose } = setup();
    const a = add('A');
    const b = add('B');
    const { word } = startAndChoose(a);
    room.chat(b, word.slice(0, -1) + 'x');
    const last = chats.at(-1)!;
    expect(last.msg.kind).toBe('close');
    expect(last.to).toEqual([b]);
  });

  it('drawer cannot chat during their turn', () => {
    const { room, add, chats, startAndChoose } = setup();
    const a = add('A');
    add('B');
    startAndChoose(a);
    const before = chats.length;
    room.chat(a, 'it is a fruit');
    expect(chats.length).toBe(before);
  });

  it('allows quick back-to-back messages but limits spam bursts', () => {
    const { room, add, chats } = setup();
    add('A');
    const b = add('B');
    const before = chats.length;
    for (let i = 0; i < 8; i++) room.chat(b, `msg ${i}`);
    expect(chats.length - before).toBe(5);
    vi.advanceTimersByTime(2000);
    room.chat(b, 'again');
    expect(chats.at(-1)!.msg.text).toBe('again');
  });

  it('turn ends when everyone guessed; drawer gets full points', () => {
    const { room, add, state, startAndChoose } = setup();
    const a = add('A');
    const b = add('B');
    const c = add('C');
    const { word } = startAndChoose(a);
    room.chat(b, word);
    vi.advanceTimersByTime(300);
    room.chat(c, word);
    expect(room.phase).toBe('turnEnd');
    const s = state(c);
    expect(s.result).toMatchObject({ word, reason: 'allGuessed' });
    expect(s.result!.points[a]).toBe(250);
    expect(s.turn!.word).toBe(word);
  });

  it('turn ends on time up; drawer gets nothing if nobody guessed', () => {
    const { room, add, state, startAndChoose } = setup();
    const a = add('A');
    add('B');
    startAndChoose(a);
    vi.advanceTimersByTime(room.settings.drawTime * 1000);
    expect(room.phase).toBe('turnEnd');
    expect(state().result).toMatchObject({ reason: 'timeUp' });
    expect(state().result!.points[a]).toBe(0);
  });

  it('reveals hints over time, never more than half the letters', () => {
    const { room, add, state, startAndChoose } = setup();
    const a = add('A');
    const b = add('B');
    room.updateSettings(a, { hints: 5 });
    const { word } = startAndChoose(a);
    vi.advanceTimersByTime(room.settings.drawTime * 1000 - 1);
    const hidden = [...state(b).turn!.hint!].filter((ch) => ch === '_').length;
    expect(word.length - hidden).toBe(Math.floor(word.length / 2));
  });

  it('plays every player once per round, then ends the game', () => {
    const { room, add, state } = setup();
    const a = add('A');
    const b = add('B');
    room.updateSettings(a, { rounds: 2 });
    room.start(a);

    const drawers: string[] = [];
    for (let i = 0; i < 4; i++) {
      drawers.push(state().turn!.drawerId);
      vi.advanceTimersByTime(CHOOSE_TIME_MS); // auto-pick
      vi.advanceTimersByTime(room.settings.drawTime * 1000); // time up
      vi.advanceTimersByTime(TURN_END_MS);
    }
    expect(drawers).toEqual([a, b, a, b]);
    expect(room.phase).toBe('gameEnd');

    room.endGame(a);
    expect(room.phase).toBe('lobby');
  });

  it('drawer leaving mid-turn ends the turn without drawer points', () => {
    const { room, add, state, startAndChoose } = setup();
    const a = add('A');
    add('B');
    add('C');
    startAndChoose(a);
    room.disconnect(a);
    expect(room.phase).toBe('turnEnd');
    expect(state().result!.reason).toBe('drawerLeft');
  });

  it('drawer disconnecting while choosing skips to the next drawer', () => {
    const { room, add, state } = setup();
    const a = add('A');
    const b = add('B');
    add('C');
    room.start(a);
    room.disconnect(a);
    expect(room.phase).toBe('choosing');
    expect(state().turn!.drawerId).toBe(b);
  });

  it('falls back to the lobby when fewer than 2 players remain', () => {
    const { room, add } = setup();
    const a = add('A');
    const b = add('B');
    room.start(a);
    room.leave(b);
    expect(room.phase).toBe('lobby');
  });

  it('does not repeat words within a game while fresh ones remain', () => {
    const { room, add, state } = setup();
    const a = add('A');
    add('B');
    room.updateSettings(a, { rounds: 3 });
    room.start(a);
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      const d = state().turn!.drawerId;
      seen.push(state(d).turn!.wordChoices![0]);
      room.chooseWord(d, 0);
      vi.advanceTimersByTime(room.settings.drawTime * 1000 + TURN_END_MS);
    }
    expect(new Set(seen).size).toBe(3);
  });
});

describe('RoomRegistry', () => {
  it('deletes a room when it empties', () => {
    const reg = new RoomRegistry({ onChange: () => {}, onChat: () => {} });
    const room = reg.create();
    const r = room.addPlayer('A', avatar);
    if (!r.ok) throw new Error();
    room.leave(r.player.id);
    expect(reg.get(room.code)).toBeUndefined();
  });

  it('normalizes codes', () => {
    expect(normalizeCode(' abcde ')).toBe('ABCDE');
    expect(normalizeCode('abc')).toBeNull();
  });
});
