import { MAX_BOARD_POINTS } from './constants';
import type { DrawOp, StrokeOp } from './protocol';

export type ApplyResult =
  | { kind: 'stroke'; stroke: StrokeOp; from: number }
  | { kind: 'clear' }
  | null;

/**
 * The ordered list of drawing ops for one canvas. Used by the server (source of
 * truth, late-join sync) and by each client (local model for redraws).
 */
export class DrawingBoard {
  private ops: StrokeOp[] = [];
  private strokes = new Map<string, StrokeOp>();
  private totalPoints = 0;

  constructor(private readonly maxPoints = MAX_BOARD_POINTS) {}

  /**
   * Applies an op. For strokes, `from` is the index of the first new point,
   * so a renderer can draw just the new segment. Returns null if rejected.
   */
  apply(op: DrawOp): ApplyResult {
    if (op.type === 'clear') {
      this.reset();
      return { kind: 'clear' };
    }

    const added = op.points.length / 2;
    if (this.totalPoints + added > this.maxPoints) return null;
    this.totalPoints += added;

    const existing = this.strokes.get(op.id);
    if (existing) {
      const from = existing.points.length / 2;
      for (const v of op.points) existing.points.push(v);
      return { kind: 'stroke', stroke: existing, from };
    }

    const stroke: StrokeOp = { ...op, points: op.points.slice() };
    this.ops.push(stroke);
    this.strokes.set(stroke.id, stroke);
    return { kind: 'stroke', stroke, from: 0 };
  }

  getOps(): readonly StrokeOp[] {
    return this.ops;
  }

  /** Deep copy, safe to send over the wire. */
  snapshot(): DrawOp[] {
    return this.ops.map((o) => ({ ...o, points: o.points.slice() }));
  }

  load(ops: DrawOp[]): void {
    this.reset();
    for (const op of ops) this.apply(op);
  }

  reset(): void {
    this.ops = [];
    this.strokes.clear();
    this.totalPoints = 0;
  }
}
