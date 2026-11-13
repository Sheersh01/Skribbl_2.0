import { AVATAR_COLORS } from './constants';
import type { Avatar, Settings } from './types';

export const SETTING_LIMITS = {
  rounds: { min: 2, max: 10, step: 1 },
  drawTime: { min: 30, max: 180, step: 10 },
  wordChoices: { min: 1, max: 5, step: 1 },
  hints: { min: 0, max: 5, step: 1 },
  maxPlayers: { min: 2, max: 12, step: 1 },
} as const;

export const DEFAULT_SETTINGS: Settings = {
  rounds: 3,
  drawTime: 80,
  wordChoices: 3,
  hints: 2,
  maxPlayers: 12,
  customWords: [],
  customOnly: false,
};

export const CUSTOM_WORD_MAX_LENGTH = 30;
export const CUSTOM_WORDS_MAX = 1000;
/** Minimum custom words needed to start with "custom words only". */
export const CUSTOM_ONLY_MIN_WORDS = 10;

export const NAME_MAX_LENGTH = 20;
export const AVATAR_COLOR_COUNT = AVATAR_COLORS.length;
/** 4 eye styles x 4 mouth styles. */
export const AVATAR_FACE_COUNT = 16;

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
};

// Control characters (C0, DEL, C1).
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

export function sanitizeWord(raw: string): string {
  return raw.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, CUSTOM_WORD_MAX_LENGTH);
}

/** Parses "apple, banana , apple" -> ["apple", "banana"]. */
export function parseCustomWords(input: string | unknown[]): string[] {
  const parts = typeof input === 'string' ? input.split(',') : input.filter((w) => typeof w === 'string');
  const out = new Set<string>();
  for (const p of parts as string[]) {
    const w = sanitizeWord(p);
    if (w) out.add(w);
    if (out.size >= CUSTOM_WORDS_MAX) break;
  }
  return [...out];
}

/** Applies an untrusted partial settings patch on top of the current settings. */
export function sanitizeSettings(patch: unknown, current: Settings, playerCount = 0): Settings {
  if (!patch || typeof patch !== 'object') return current;
  const p = patch as Record<string, unknown>;
  const L = SETTING_LIMITS;
  const next: Settings = { ...current };

  if ('rounds' in p) next.rounds = clampInt(p.rounds, L.rounds.min, L.rounds.max, current.rounds);
  if ('drawTime' in p) {
    const t = clampInt(p.drawTime, L.drawTime.min, L.drawTime.max, current.drawTime);
    next.drawTime = Math.round(t / L.drawTime.step) * L.drawTime.step;
  }
  if ('wordChoices' in p) next.wordChoices = clampInt(p.wordChoices, L.wordChoices.min, L.wordChoices.max, current.wordChoices);
  if ('hints' in p) next.hints = clampInt(p.hints, L.hints.min, L.hints.max, current.hints);
  if ('maxPlayers' in p) {
    const min = Math.max(L.maxPlayers.min, playerCount);
    next.maxPlayers = clampInt(p.maxPlayers, min, L.maxPlayers.max, current.maxPlayers);
  }
  if ('customWords' in p && Array.isArray(p.customWords)) next.customWords = parseCustomWords(p.customWords);
  if ('customOnly' in p && typeof p.customOnly === 'boolean') next.customOnly = p.customOnly;

  return next;
}

/** Returns a clean name, or null if nothing usable is left. */
export function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX_LENGTH);
  return name || null;
}

export function sanitizeAvatar(raw: unknown): Avatar {
  const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    color: clampInt(a.color, 0, AVATAR_COLOR_COUNT - 1, 0),
    face: clampInt(a.face, 0, AVATAR_FACE_COUNT - 1, 0),
  };
}
