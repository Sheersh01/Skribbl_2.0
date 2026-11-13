/** Logical canvas size. All drawing coordinates live in this space. */
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

/** Backing-store multiplier: the real bitmap is 1600x1200 on every client, so fills match everywhere. */
export const CANVAS_SCALE = 2;

export const BACKGROUND_COLOR = '#ffffff';

export const PALETTE = [
  '#000000', '#4b5563', '#9ca3af', '#ffffff',
  '#ef4444', '#f97316', '#facc15', '#22c55e',
  '#14b8a6', '#3b82f6', '#1e3a8a', '#a855f7',
  '#ec4899', '#fda4af', '#92400e', '#d6a26b',
] as const;

export const BRUSH_SIZES = [4, 10, 20, 36] as const;

export const AVATAR_COLORS = [
  '#f87171', '#fb923c', '#facc15', '#a3e635',
  '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8',
  '#c084fc', '#f472b6', '#d6a26b', '#94a3b8',
] as const;

/** How often the drawer flushes buffered points to the server. */
export const STROKE_FLUSH_MS = 40;

/** Turn timings. */
export const CHOOSE_TIME_MS = 15_000;
export const TURN_END_MS = 6_000;

export const CHAT_MAX_LENGTH = 100;
/** Spam limit: at most CHAT_BURST messages per CHAT_WINDOW_MS. */
export const CHAT_BURST = 5;
export const CHAT_WINDOW_MS = 2_000;

/** Safety limits. */
export const MAX_POINTS_PER_BATCH = 500;
export const MAX_BOARD_POINTS = 200_000;
