import type { ReactNode } from 'react';
import { leaveRoom, useGame } from '../store';
import { Logo } from './Logo';

export function RoomHeader({ code, children }: { code: string; children?: ReactNode }) {
  const connected = useGame((s) => s.connected);
  return (
    <header className="flex flex-wrap items-center justify-between gap-2">
      <Logo />
      <div className="flex items-center gap-2">
        {!connected && (
          <span className="rounded-full bg-rose-500 px-3 py-1 text-sm font-semibold text-white">Reconnecting…</span>
        )}
        <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-bold tracking-widest text-slate-700 shadow">
          {code}
        </span>
        {children}
        <button
          type="button"
          onClick={() => leaveRoom()}
          className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-700 shadow hover:bg-white"
        >
          Leave
        </button>
      </div>
    </header>
  );
}
