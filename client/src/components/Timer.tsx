import { useEffect, useState } from 'react';
import { useGame } from '../store';

/** Countdown to the current phase deadline (server-driven). */
export function Timer() {
  const deadline = useGame((s) => s.deadline);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  if (deadline === null) return null;
  const secs = Math.max(0, Math.ceil((deadline - now) / 1000));
  const urgent = secs <= 10;

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 text-lg font-bold ${urgent ? 'animate-pulse border-rose-400 bg-rose-50 text-rose-600' : 'border-slate-300 bg-white text-slate-700'}`}
      aria-label={`${secs} seconds left`}
    >
      {secs}
    </div>
  );
}
