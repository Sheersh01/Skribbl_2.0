import {
  BACKGROUND_COLOR,
  CANVAS_HEIGHT,
  CANVAS_SCALE,
  CANVAS_WIDTH,
  type StrokeOp,
} from '@skribbl/shared';

/** Draws ops onto a fixed-resolution canvas (same bitmap size on every client). */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = CANVAS_WIDTH * CANVAS_SCALE;
    canvas.height = CANVAS_HEIGHT * CANVAS_SCALE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('2D canvas not supported');
    this.ctx = ctx;
    ctx.setTransform(CANVAS_SCALE, 0, 0, CANVAS_SCALE, 0, 0);
    this.clear();
  }

  clear(): void {
    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  redraw(ops: readonly StrokeOp[]): void {
    this.clear();
    for (const op of ops) this.drawStroke(op, 0);
  }

  /** Draws a stroke starting at point index `from` (0 = whole stroke). */
  drawStroke(stroke: StrokeOp, from: number): void {
    const { ctx } = this;
    const p = stroke.points;
    const n = p.length / 2;
    const color = stroke.tool === 'eraser' ? BACKGROUND_COLOR : stroke.color;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let start = from;
    if (from === 0) {
      // A dot, so a single tap leaves a mark.
      ctx.beginPath();
      ctx.arc(p[0], p[1], stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
      start = 1;
    }
    if (start >= n) return;

    ctx.beginPath();
    ctx.moveTo(p[(start - 1) * 2], p[(start - 1) * 2 + 1]);
    for (let i = start; i < n; i++) ctx.lineTo(p[i * 2], p[i * 2 + 1]);
    ctx.stroke();
  }
}
