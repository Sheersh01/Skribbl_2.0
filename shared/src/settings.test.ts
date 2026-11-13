import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  parseCustomWords,
  sanitizeAvatar,
  sanitizeName,
  sanitizeSettings,
} from './settings';

describe('sanitizeSettings', () => {
  it('clamps numbers into range and ignores unknown keys', () => {
    const s = sanitizeSettings({ rounds: 99, hints: -3, drawTime: 87, evil: true }, DEFAULT_SETTINGS);
    expect(s.rounds).toBe(10);
    expect(s.hints).toBe(0);
    expect(s.drawTime).toBe(90);
    expect(s).not.toHaveProperty('evil');
  });

  it('keeps current values for wrong types', () => {
    const s = sanitizeSettings({ rounds: 'lots', customOnly: 'yes' }, DEFAULT_SETTINGS);
    expect(s.rounds).toBe(DEFAULT_SETTINGS.rounds);
    expect(s.customOnly).toBe(false);
  });

  it('never sets max players below the current player count', () => {
    expect(sanitizeSettings({ maxPlayers: 2 }, DEFAULT_SETTINGS, 5).maxPlayers).toBe(5);
  });

  it('cleans custom words', () => {
    const s = sanitizeSettings({ customWords: ['  Apple ', 'apple', '', 'Ice   Cream', 42] }, DEFAULT_SETTINGS);
    expect(s.customWords).toEqual(['apple', 'ice cream']);
  });
});

describe('parseCustomWords', () => {
  it('splits on commas, trims, lowercases, dedupes', () => {
    expect(parseCustomWords('Cat, dog ,, CAT,  hot dog ')).toEqual(['cat', 'dog', 'hot dog']);
  });
});

describe('sanitizeName / sanitizeAvatar', () => {
  it('trims names and rejects empty ones', () => {
    expect(sanitizeName('  Sam  ')).toBe('Sam');
    expect(sanitizeName('   ')).toBeNull();
    expect(sanitizeName(42)).toBeNull();
    expect(sanitizeName('x'.repeat(50))).toHaveLength(20);
  });

  it('clamps avatar indices', () => {
    expect(sanitizeAvatar({ color: 999, face: -1 })).toEqual({ color: 11, face: 0 });
    expect(sanitizeAvatar(null)).toEqual({ color: 0, face: 0 });
  });
});
