import { describe, expect, it } from 'vitest';
import { validateOp } from './validate';

const good = { type: 'stroke', id: 'x', tool: 'pen', color: '#ff0000', size: 10, points: [1, 2] };

describe('validateOp', () => {
  it('accepts a valid stroke', () => {
    expect(validateOp(good)).toEqual(good);
  });

  it('clamps and rounds coordinates into the canvas', () => {
    const op = validateOp({ ...good, points: [-5, 9999, 10.6, 20.2] });
    expect(op).toMatchObject({ points: [0, 600, 11, 20] });
  });

  it.each([
    ['bad color', { ...good, color: 'red' }],
    ['bad size', { ...good, size: 7 }],
    ['odd points', { ...good, points: [1, 2, 3] }],
    ['NaN point', { ...good, points: [1, NaN] }],
    ['unknown type', { ...good, type: 'nope' }],
    ['missing id', { ...good, id: '' }],
    ['not an object', 'hello'],
  ])('rejects %s', (_label, input) => {
    expect(validateOp(input)).toBeNull();
  });

  it('accepts clear', () => {
    expect(validateOp({ type: 'clear', id: 'c' })).toEqual({ type: 'clear', id: 'c' });
  });
});
