import { describe, expect, it } from 'vitest';
import { isCloseGuess, isCorrectGuess, levenshtein, normalizeGuess } from './guess';
import { hintSchedule, maskWord, maxHints, pickHintIndex } from './hints';
import { drawerPoints, guesserPoints } from './scoring';
import { EN_WORDS, pickWords } from './words';

describe('guess', () => {
  it('normalizes case, accents, hyphens and spaces', () => {
    expect(normalizeGuess('  Crème   Brûlée ')).toBe('creme brulee');
    expect(normalizeGuess('Yo-Yo')).toBe('yo yo');
  });

  it('matches correct guesses loosely', () => {
    expect(isCorrectGuess('HOT DOG', 'hot dog')).toBe(true);
    expect(isCorrectGuess('hotdog', 'hot dog')).toBe(false);
    expect(isCorrectGuess('yo yo', 'yo-yo')).toBe(true);
  });

  it('flags one-typo guesses as close on 4+ letter words', () => {
    expect(isCloseGuess('banan', 'banana')).toBe(true);
    expect(isCloseGuess('bananna', 'banana')).toBe(true);
    expect(isCloseGuess('bonana', 'banana')).toBe(true);
    expect(isCloseGuess('banana', 'banana')).toBe(false);
    expect(isCloseGuess('cot', 'cat')).toBe(false); // too short
    expect(isCloseGuess('bnn', 'banana')).toBe(false);
  });

  it('levenshtein', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});

describe('hints', () => {
  it('masks letters but keeps spaces and punctuation', () => {
    expect(maskWord('ice cream', new Set())).toBe('___ _____');
    expect(maskWord('yo-yo', new Set([0]))).toBe('y_-__');
  });

  it('caps hints at half the letters', () => {
    expect(maxHints('cat', 5)).toBe(1);
    expect(maxHints('elephant', 2)).toBe(2);
    expect(maxHints('ox', 0)).toBe(0);
  });

  it('spreads hints across the turn', () => {
    expect(hintSchedule(90_000, 2, 'elephant')).toEqual([30_000, 60_000]);
  });

  it('only picks hidden letters', () => {
    expect(pickHintIndex('a b', new Set([0]), () => 0)).toBe(2);
    expect(pickHintIndex('ab', new Set([0, 1]))).toBeNull();
  });
});

describe('scoring', () => {
  it('guessers get 100–300 by speed, +50 for first', () => {
    expect(guesserPoints(80_000, 80_000, false)).toBe(300);
    expect(guesserPoints(0, 80_000, false)).toBe(100);
    expect(guesserPoints(40_000, 80_000, true)).toBe(250);
  });

  it('drawer scales with the share who guessed', () => {
    expect(drawerPoints(0, 3)).toBe(0);
    expect(drawerPoints(3, 3)).toBe(250);
    expect(drawerPoints(1, 3)).toBe(85);
    expect(drawerPoints(1, 0)).toBe(0);
  });
});

describe('words', () => {
  it('built-in list is large, lowercase and has no duplicates', () => {
    expect(EN_WORDS.length).toBeGreaterThanOrEqual(400);
    expect(new Set(EN_WORDS).size).toBe(EN_WORDS.length);
    expect(EN_WORDS.every((w) => w === w.toLowerCase().trim())).toBe(true);
  });

  it('pickWords prefers unused words', () => {
    const picked = pickWords(['a', 'b', 'c'], 2, new Set(['a']));
    expect(picked).toHaveLength(2);
    expect(picked).not.toContain('a');
    expect(pickWords(['a'], 3, new Set(['a']))).toEqual(['a']);
  });
});
