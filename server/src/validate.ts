import {
  BRUSH_SIZES,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MAX_POINTS_PER_BATCH,
  type DrawOp,
} from '@skribbl/shared';

const COLOR_RE = /^#[0-9a-f]{6}$/i;
const clamp = (v: number, max: number) => Math.min(max, Math.max(0, Math.round(v)));

/** Never trust the client: returns a clean op, or null if malformed. */
export function validateOp(raw: unknown): DrawOp | null {
  if (!raw || typeof raw !== 'object') return null;
  const op = raw as Record<string, unknown>;
  if (typeof op.id !== 'string' || op.id.length === 0 || op.id.length > 40) return null;

  if (op.type === 'clear') return { type: 'clear', id: op.id };
  if (op.type !== 'stroke') return null;

  if (op.tool !== 'pen' && op.tool !== 'eraser') return null;
  if (typeof op.color !== 'string' || !COLOR_RE.test(op.color)) return null;
  if (!BRUSH_SIZES.includes(op.size as (typeof BRUSH_SIZES)[number])) return null;

  const pts = op.points;
  if (!Array.isArray(pts) || pts.length === 0 || pts.length % 2 !== 0) return null;
  if (pts.length > MAX_POINTS_PER_BATCH * 2) return null;
  if (!pts.every((v) => typeof v === 'number' && Number.isFinite(v))) return null;

  const points = pts.map((v, i) => clamp(v, i % 2 === 0 ? CANVAS_WIDTH : CANVAS_HEIGHT));
  return { type: 'stroke', id: op.id, tool: op.tool, color: op.color, size: op.size as number, points };
}
