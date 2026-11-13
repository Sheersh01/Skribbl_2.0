const isLetter = (ch: string) => /[\p{L}\p{N}]/u.test(ch);

/** Indices of characters that are hidden in the hint (letters and digits). */
export function letterIndices(word: string): number[] {
  const out: number[] = [];
  [...word].forEach((ch, i) => {
    if (isLetter(ch)) out.push(i);
  });
  return out;
}

/** "ice cream" with {0} revealed -> "i__ _____". Spaces/punctuation stay visible. */
export function maskWord(word: string, revealed: ReadonlySet<number>): string {
  return [...word].map((ch, i) => (isLetter(ch) && !revealed.has(i) ? '_' : ch)).join('');
}

/** Never reveal more than half the letters. */
export function maxHints(word: string, hintSetting: number): number {
  return Math.min(hintSetting, Math.floor(letterIndices(word).length / 2));
}

/** Milliseconds after the turn starts at which each hint is revealed. */
export function hintSchedule(drawTimeMs: number, hintSetting: number, word: string): number[] {
  const n = maxHints(word, hintSetting);
  return Array.from({ length: n }, (_, i) => Math.round((drawTimeMs * (i + 1)) / (hintSetting + 1)));
}

/** Picks a random still-hidden letter index, or null if none left. */
export function pickHintIndex(word: string, revealed: ReadonlySet<number>, random = Math.random): number | null {
  const hidden = letterIndices(word).filter((i) => !revealed.has(i));
  if (hidden.length === 0) return null;
  return hidden[Math.floor(random() * hidden.length)];
}
