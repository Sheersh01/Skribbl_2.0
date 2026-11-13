import { BRUSH_SIZES, PALETTE, type Tool } from '@skribbl/shared';
import type { BrushState } from './Canvas';

interface Props {
  brush: BrushState;
  onChange: (brush: BrushState) => void;
  onClear: () => void;
}

export function Toolbar({ brush, onChange, onClear }: Props) {
  const set = (patch: Partial<BrushState>) => onChange({ ...brush, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white/95 p-2 shadow">
      {/* Current color preview */}
      <div
        className="h-10 w-10 shrink-0 rounded-lg border-2 border-slate-300"
        style={{ background: brush.tool === 'eraser' ? '#ffffff' : brush.color }}
        title="Current color"
      />

      {/* Palette */}
      <div className="grid grid-cols-8 gap-0.5 overflow-hidden rounded-lg border-2 border-slate-300">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onClick={() => set({ color: c, tool: 'pen' })}
            className={`h-5 w-5 sm:h-6 sm:w-6 ${brush.color === c && brush.tool === 'pen' ? 'ring-2 ring-inset ring-slate-900' : ''}`}
            style={{ background: c }}
          />
        ))}
      </div>

      {/* Sizes */}
      <div className="flex gap-1">
        {BRUSH_SIZES.map((s) => (
          <button
            key={s}
            type="button"
            aria-label={`Brush size ${s}`}
            onClick={() => set({ size: s })}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 ${brush.size === s ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white'}`}
          >
            <span className="rounded-full bg-slate-900" style={{ width: Math.max(4, s * 0.7), height: Math.max(4, s * 0.7) }} />
          </button>
        ))}
      </div>

      {/* Tools */}
      <div className="flex gap-1">
        {(['pen', 'eraser'] as Tool[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => set({ tool: t })}
            className={`h-10 rounded-lg border-2 px-3 font-semibold capitalize ${brush.tool === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-300 bg-white text-slate-700'}`}
          >
            {t === 'pen' ? '✏️ Pen' : '🧽 Eraser'}
          </button>
        ))}
        <button
          type="button"
          onClick={onClear}
          className="h-10 rounded-lg border-2 border-rose-300 bg-rose-50 px-3 font-semibold text-rose-700 hover:bg-rose-100"
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}
