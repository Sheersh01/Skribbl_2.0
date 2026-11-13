import { describe, expect, it } from 'vitest';
import { DrawingBoard } from './board';
import type { StrokeOp } from './protocol';

const stroke = (id: string, points: number[]): StrokeOp => ({
  type: 'stroke', id, tool: 'pen', color: '#000000', size: 4, points,
});

describe('DrawingBoard', () => {
  it('creates a stroke on first chunk and appends later chunks', () => {
    const b = new DrawingBoard();
    expect(b.apply(stroke('a', [1, 2, 3, 4]))).toMatchObject({ kind: 'stroke', from: 0 });
    const r = b.apply(stroke('a', [5, 6]));
    expect(r).toMatchObject({ kind: 'stroke', from: 2 });
    expect(b.getOps()).toHaveLength(1);
    expect(b.getOps()[0].points).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('keeps strokes in first-seen order', () => {
    const b = new DrawingBoard();
    b.apply(stroke('a', [0, 0]));
    b.apply(stroke('b', [1, 1]));
    b.apply(stroke('a', [2, 2]));
    expect(b.getOps().map((o) => o.id)).toEqual(['a', 'b']);
  });

  it('clear wipes everything', () => {
    const b = new DrawingBoard();
    b.apply(stroke('a', [0, 0]));
    expect(b.apply({ type: 'clear', id: 'c' })).toEqual({ kind: 'clear' });
    expect(b.getOps()).toHaveLength(0);
  });

  it('rejects ops past the point cap', () => {
    const b = new DrawingBoard(3);
    expect(b.apply(stroke('a', [0, 0, 1, 1]))).not.toBeNull();
    expect(b.apply(stroke('a', [2, 2, 3, 3]))).toBeNull();
    expect(b.getOps()[0].points).toHaveLength(4);
  });

  it('snapshot is a deep copy that round-trips through load', () => {
    const b = new DrawingBoard();
    b.apply(stroke('a', [1, 1, 2, 2]));
    const snap = b.snapshot();
    b.apply(stroke('a', [3, 3]));
    expect((snap[0] as StrokeOp).points).toEqual([1, 1, 2, 2]);

    const c = new DrawingBoard();
    c.load(snap);
    expect(c.getOps()[0].points).toEqual([1, 1, 2, 2]);
  });
});
