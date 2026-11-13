import { useEffect, useRef } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DrawingBoard,
  STROKE_FLUSH_MS,
  type ApplyResult,
  type DrawOp,
  type StrokeOp,
  type Tool,
} from '@skribbl/shared';
import { CanvasRenderer } from '../canvas/renderer';
import { socket } from '../socket';
import { useGame } from '../store';

export interface BrushState {
  tool: Tool;
  color: string;
  size: number;
}

interface Props {
  brush: BrushState;
  /** Incremented by the parent to request a clear. */
  clearSignal: number;
  /** Only the current drawer may draw. */
  canDraw: boolean;
  /** Changes every turn; the canvas starts blank. */
  turnId: number;
}

const makeId = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36);

export function Canvas({ brush, clearSignal, canDraw, turnId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const boardRef = useRef(new DrawingBoard());
  const brushRef = useRef(brush);
  brushRef.current = brush;
  const canDrawRef = useRef(canDraw);
  canDrawRef.current = canDraw;

  // The stroke being drawn right now, plus points not yet sent to the server.
  const activeRef = useRef<Omit<StrokeOp, 'points'> | null>(null);
  const pendingRef = useRef<number[]>([]);
  const lastPointRef = useRef<[number, number] | null>(null);

  const render = (result: ApplyResult) => {
    const r = rendererRef.current;
    if (!r || !result) return;
    if (result.kind === 'clear') r.clear();
    else r.drawStroke(result.stroke, result.from);
  };

  const flush = () => {
    const active = activeRef.current;
    if (!active || pendingRef.current.length === 0) return;
    socket.emit('draw:op', { ...active, points: pendingRef.current });
    pendingRef.current = [];
  };

  // Setup: renderer, network listeners, periodic flush.
  useEffect(() => {
    const renderer = new CanvasRenderer(canvasRef.current!);
    rendererRef.current = renderer;
    const board = boardRef.current;

    const onSync = (ops: DrawOp[]) => {
      board.load(ops);
      renderer.redraw(board.getOps());
    };
    const onOp = (op: DrawOp) => render(board.apply(op));

    socket.on('draw:sync', onSync);
    socket.on('draw:op', onOp);
    const timer = setInterval(flush, STROKE_FLUSH_MS);

    return () => {
      socket.off('draw:sync', onSync);
      socket.off('draw:op', onOp);
      clearInterval(timer);
    };
  }, []);

  // New turn: blank canvas (the server reset its copy too).
  useEffect(() => {
    boardRef.current.reset();
    rendererRef.current?.clear();
    activeRef.current = null;
    pendingRef.current = [];
  }, [turnId]);

  // Lost the right to draw mid-stroke (time up / everyone guessed): drop the stroke.
  useEffect(() => {
    if (!canDraw) {
      activeRef.current = null;
      pendingRef.current = [];
    }
  }, [canDraw]);

  // Ask for the full canvas on mount and after every (re)join.
  const joinCount = useGame((s) => s.joinCount);
  useEffect(() => {
    socket.emit('draw:requestSync');
  }, [joinCount]);

  // Clear requests from the toolbar.
  useEffect(() => {
    if (clearSignal === 0) return;
    const op: DrawOp = { type: 'clear', id: makeId() };
    render(boardRef.current.apply(op));
    socket.emit('draw:op', op);
  }, [clearSignal]);

  const toLogical = (e: PointerEvent | React.PointerEvent): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    return [
      Math.round(Math.min(CANVAS_WIDTH, Math.max(0, x))),
      Math.round(Math.min(CANVAS_HEIGHT, Math.max(0, y))),
    ];
  };

  /** Adds points to the active stroke: draws locally now, sends on next flush. */
  const addPoints = (pts: [number, number][]) => {
    const active = activeRef.current;
    if (!active) return;
    const flat: number[] = [];
    for (const [x, y] of pts) {
      const last = lastPointRef.current;
      if (last && last[0] === x && last[1] === y) continue;
      lastPointRef.current = [x, y];
      flat.push(x, y);
    }
    if (flat.length === 0) return;
    render(boardRef.current.apply({ ...active, points: flat }));
    pendingRef.current.push(...flat);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !canDrawRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { tool, color, size } = brushRef.current;
    activeRef.current = { type: 'stroke', id: makeId(), tool, color, size };
    lastPointRef.current = null;
    addPoints([toLogical(e)]);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeRef.current) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    addPoints((events.length ? events : [e.nativeEvent]).map(toLogical));
  };

  const endStroke = () => {
    if (!activeRef.current) return;
    flush();
    activeRef.current = null;
    lastPointRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      className={`block aspect-4/3 w-full rounded-xl bg-white shadow-inner select-none ${canDraw ? 'cursor-crosshair touch-none' : 'cursor-default'}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
      onLostPointerCapture={endStroke}
    />
  );
}
