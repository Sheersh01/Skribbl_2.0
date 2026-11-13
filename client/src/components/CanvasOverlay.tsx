import type { RoomState, TurnEndReason } from '@skribbl/shared';
import { chooseWord, endGame } from '../store';
import { Avatar } from './Avatar';

const REASONS: Record<TurnEndReason, string> = {
  allGuessed: 'Everyone guessed it!',
  timeUp: "Time's up!",
  drawerLeft: 'The drawer left.',
};

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-2 z-10 flex items-center justify-center rounded-xl bg-slate-900/70 p-4 backdrop-blur-[2px]">
      <div className="max-h-full w-full max-w-md overflow-y-auto text-center text-white">{children}</div>
    </div>
  );
}

function Podium({ room, meId }: { room: RoomState; meId: string }) {
  const ranked = [...room.players].sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 3);
  // Visual order: 2nd, 1st, 3rd.
  const podium = [top[1], top[0], top[2]].filter(Boolean);
  const heights: Record<number, string> = { 0: 'h-24', 1: 'h-16', 2: 'h-12' };
  const isHost = room.hostId === meId;

  return (
    <Panel>
      <h2 className="mb-4 text-3xl font-bold text-yellow-300">Game over!</h2>
      <div className="mb-4 flex items-end justify-center gap-2">
        {podium.map((p) => {
          const place = ranked.indexOf(p);
          return (
            <div key={p.id} className="flex w-24 flex-col items-center">
              <Avatar avatar={p.avatar} size={place === 0 ? 72 : 56} />
              <div className="w-full truncate font-semibold">{p.name}</div>
              <div className="text-sm text-white/80">{p.score} pts</div>
              <div
                className={`mt-1 flex w-full items-start justify-center rounded-t-lg pt-1 text-2xl font-bold ${heights[place]} ${place === 0 ? 'bg-yellow-400 text-yellow-900' : place === 1 ? 'bg-slate-300 text-slate-700' : 'bg-amber-600 text-amber-100'}`}
              >
                {place + 1}
              </div>
            </div>
          );
        })}
      </div>
      {ranked.length > 3 && (
        <ol start={4} className="mx-auto mb-4 max-w-xs text-left text-sm">
          {ranked.slice(3).map((p, i) => (
            <li key={p.id} className="flex justify-between border-b border-white/10 py-1">
              <span>
                #{i + 4} {p.name}
              </span>
              <span>{p.score}</span>
            </li>
          ))}
        </ol>
      )}
      {isHost ? (
        <button
          type="button"
          onClick={endGame}
          className="rounded-xl bg-green-500 px-6 py-2 text-lg font-bold text-white shadow-[0_4px_0_#15803d] hover:bg-green-400"
        >
          Back to lobby
        </button>
      ) : (
        <p className="text-white/80">Waiting for the host…</p>
      )}
    </Panel>
  );
}

/** Covers the canvas while choosing a word, between turns, and at the end. */
export function CanvasOverlay({ room, meId }: { room: RoomState; meId: string }) {
  const turn = room.turn;
  const drawer = room.players.find((p) => p.id === turn?.drawerId);

  if (room.phase === 'gameEnd') return <Podium room={room} meId={meId} />;

  if (room.phase === 'choosing' && turn) {
    if (turn.wordChoices) {
      return (
        <Panel>
          <h2 className="mb-4 text-2xl font-bold">Choose a word</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {turn.wordChoices.map((w, i) => (
              <button
                key={w}
                type="button"
                onClick={() => chooseWord(i)}
                className="rounded-xl border-2 border-white bg-white/10 px-4 py-2 text-lg font-bold hover:bg-white hover:text-slate-900"
              >
                {w}
              </button>
            ))}
          </div>
        </Panel>
      );
    }
    return (
      <Panel>
        {drawer && <Avatar avatar={drawer.avatar} size={72} className="mx-auto mb-2" />}
        <p className="text-xl font-semibold">{drawer?.name ?? 'Someone'} is choosing a word…</p>
      </Panel>
    );
  }

  if (room.phase === 'turnEnd' && room.result) {
    const { word, reason, points } = room.result;
    const rows = room.players
      .map((p) => ({ p, pts: points[p.id] ?? 0 }))
      .sort((a, b) => b.pts - a.pts);
    return (
      <Panel>
        <p className="text-lg text-white/80">{REASONS[reason]}</p>
        <p className="mb-4 text-2xl">
          The word was <span className="font-bold text-yellow-300">{word}</span>
        </p>
        <ul className="mx-auto max-w-xs text-left">
          {rows.map(({ p, pts }) => (
            <li key={p.id} className="flex justify-between py-0.5">
              <span className="truncate">
                {p.name}
                {p.id === turn?.drawerId && ' ✏️'}
              </span>
              <span className={`font-bold ${pts > 0 ? 'text-green-400' : 'text-rose-300'}`}>+{pts}</span>
            </li>
          ))}
        </ul>
      </Panel>
    );
  }

  return null;
}
