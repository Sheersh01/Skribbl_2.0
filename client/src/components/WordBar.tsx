import type { RoomState } from '@skribbl/shared';
import { Timer } from './Timer';

/** Top bar: timer, round, and the word (or its blanks). */
export function WordBar({ room, meId }: { room: RoomState; meId: string }) {
  const turn = room.turn;
  const drawer = room.players.find((p) => p.id === turn?.drawerId);
  const isDrawer = turn?.drawerId === meId;

  let center: React.ReactNode = null;
  if (room.phase === 'choosing') {
    center = (
      <span className="text-lg font-semibold text-slate-600">
        {isDrawer ? 'Choose a word!' : `${drawer?.name ?? 'Someone'} is choosing…`}
      </span>
    );
  } else if (turn?.word) {
    center = (
      <div className="text-center">
        <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          {isDrawer ? 'Draw this' : room.phase === 'turnEnd' ? 'The word was' : 'You got it!'}
        </div>
        <div className="text-2xl font-bold tracking-wider text-slate-800">{turn.word}</div>
      </div>
    );
  } else if (turn?.hint) {
    const lengths = turn.hint.split(' ').map((w) => w.length).join(' ');
    center = (
      <div className="text-center">
        <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Guess this</div>
        <div className="flex items-end gap-1">
          <span className="font-mono text-2xl font-bold tracking-[0.35em] whitespace-pre text-slate-800">{turn.hint}</span>
          <sup className="text-sm font-semibold text-slate-500">{lengths}</sup>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-16 items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-lg">
      {room.phase === 'choosing' || room.phase === 'drawing' ? <Timer /> : <div className="w-12 shrink-0" />}
      <div className="w-24 shrink-0 text-sm font-semibold text-slate-600">
        {turn ? `Round ${turn.round} of ${room.settings.rounds}` : ''}
      </div>
      <div className="flex min-w-0 flex-1 justify-center overflow-hidden">{center}</div>
      <div className="w-24 shrink-0 sm:w-36" />
    </div>
  );
}
