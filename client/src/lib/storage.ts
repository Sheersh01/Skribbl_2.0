import {
  AVATAR_COLOR_COUNT,
  AVATAR_FACE_COUNT,
  sanitizeAvatar,
  type JoinInfo,
  type Profile,
} from '@skribbl/shared';

const PROFILE_KEY = 'dg.profile';
const SESSION_KEY = 'dg.session';

export const randomAvatar = () => ({
  color: Math.floor(Math.random() * AVATAR_COLOR_COUNT),
  face: Math.floor(Math.random() * AVATAR_FACE_COUNT),
});

/** Name + avatar: remembered across visits (localStorage). */
export function loadProfile(): Profile {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null');
    if (raw && typeof raw.name === 'string') return { name: raw.name, avatar: sanitizeAvatar(raw.avatar) };
  } catch {
    /* storage unavailable or corrupt */
  }
  return { name: '', avatar: randomAvatar() };
}

export function saveProfile(p: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

/**
 * Room session: per tab (sessionStorage), so a refresh rejoins the same slot
 * but a second tab is a new player — handy for testing.
 */
export function loadSession(): JoinInfo | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
    if (raw && typeof raw.code === 'string' && typeof raw.sessionId === 'string' && typeof raw.playerId === 'string') {
      return raw as JoinInfo;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveSession(s: JoinInfo | null): void {
  try {
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
