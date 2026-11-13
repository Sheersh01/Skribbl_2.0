/**
 * Scoring v2 (see MVP-PLAN.md). Starting values — tune after playtesting.
 */

const round5 = (n: number) => Math.round(n / 5) * 5;

export const GUESS_BASE = 100;
export const GUESS_SPEED_BONUS = 200;
export const FIRST_GUESS_BONUS = 50;
export const DRAWER_MAX = 250;

/** 100–300 points depending on time left, +50 for the first correct guess. */
export function guesserPoints(msLeft: number, drawTimeMs: number, isFirst: boolean): number {
  const frac = drawTimeMs > 0 ? Math.min(1, Math.max(0, msLeft / drawTimeMs)) : 0;
  return round5(GUESS_BASE + GUESS_SPEED_BONUS * frac) + (isFirst ? FIRST_GUESS_BONUS : 0);
}

/** Scales with the share of guessers who got it: 0 if nobody, 250 if everyone. */
export function drawerPoints(correct: number, guessers: number): number {
  if (guessers <= 0 || correct <= 0) return 0;
  return round5(DRAWER_MAX * Math.min(1, correct / guessers));
}
