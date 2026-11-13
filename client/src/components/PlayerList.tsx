import type { RoomState } from '@skribbl/shared';
import { kickPlayer } from '../store';
import { Avatar } from './Avatar';

interface Props {
  room: RoomState;
  meId: string;
  showScores?: boolean;
}

export function PlayerList({ room, meId, showScores = false }: Props) {
  const iAmHost = room.hostId === meId;
  const drawerId = room.turn?.drawerId;
  // Rank by score (ties share a rank).
  const rankOf = (score: number) => 1 + room.players.filter((p) => p.score > score).length;

  return (
    <ul className="flex flex-col gap-1.5">
      {room.players.map((p) => {
        const isHost = p.id === room.hostId;
        const isMe = p.id === meId;
        const bg = p.guessed ? 'bg-green-100' : isMe ? 'bg-yellow-100' : 'bg-slate-50';
        return (
          <li
            key={p.id}
            className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${bg} ${p.connected ? '' : 'opacity-45'}`}
          >
            {showScores && <span className="w-6 shrink-0 text-center text-sm font-bold text-slate-500">#{rankOf(p.score)}</span>}
            <Avatar avatar={p.avatar} size={40} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-slate-800">
                {p.name}
                {isMe && <span className="font-normal text-slate-500"> (you)</span>}
              </div>
              <div className="text-xs text-slate-500">
                {isHost && <span title="Host">👑 </span>}
                {!p.connected && <span>reconnecting… </span>}
                {showScores && <span className="font-semibold text-slate-700">{p.score} pts</span>}
              </div>
            </div>
            {p.id === drawerId && (room.phase === 'choosing' || room.phase === 'drawing') && (
              <span title="Drawing" className="text-xl">✏️</span>
            )}
            {iAmHost && !isMe && (
              <button
                type="button"
                title={`Kick ${p.name}`}
                aria-label={`Kick ${p.name}`}
                onClick={() => {
                  if (confirm(`Kick ${p.name} from the room?`)) kickPlayer(p.id);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-600"
              >
                ✕
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
