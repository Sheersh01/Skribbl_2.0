import { useState } from 'react';
import { BRUSH_SIZES, PALETTE, type RoomState } from '@skribbl/shared';
import { Canvas, type BrushState } from '../components/Canvas';
import { CanvasOverlay } from '../components/CanvasOverlay';
import { Chat } from '../components/Chat';
import { PlayerList } from '../components/PlayerList';
import { RoomHeader } from '../components/RoomHeader';
import { Toolbar } from '../components/Toolbar';
import { WordBar } from '../components/WordBar';
import { endGame } from '../store';

export function Game({ room, meId }: { room: RoomState; meId: string }) {
  const [brush, setBrush] = useState<BrushState>({ tool: 'pen', color: PALETTE[0], size: BRUSH_SIZES[1] });
  const [clearSignal, setClearSignal] = useState(0);
  const isHost = room.hostId === meId;
  const isDrawer = room.turn?.drawerId === meId;
  const canDraw = isDrawer && room.phase === 'drawing';
  const inTurn = room.phase === 'choosing' || room.phase === 'drawing';

  const me = room.players.find((p) => p.id === meId);
  const chatDisabled = isDrawer && inTurn ? "You're drawing — no hints in chat!" : null;
  const chatPlaceholder = me?.guessed && room.phase === 'drawing' ? 'Chat with others who guessed…' : undefined;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-3 p-2 sm:p-4">
      <RoomHeader code={room.code}>
        {isHost && room.phase !== 'gameEnd' && (
          <button
            type="button"
            onClick={() => {
              if (confirm('End the game for everyone and go back to the lobby?')) endGame();
            }}
            className="rounded-full bg-yellow-300 px-3 py-1 text-sm font-semibold text-slate-800 shadow hover:bg-yellow-200"
          >
            End game
          </button>
        )}
      </RoomHeader>

      <WordBar room={room} meId={meId} />

      <div className="grid gap-3 lg:grid-cols-[220px_1fr_300px]">
        {/* Players */}
        <section className="order-3 rounded-2xl bg-white p-2 shadow-lg lg:order-1">
          <PlayerList room={room} meId={meId} showScores />
        </section>

        {/* Canvas + tools */}
        <div className="order-1 flex flex-col gap-3 lg:order-2">
          <div className="relative rounded-2xl bg-white/20 p-2 shadow-lg">
            <Canvas brush={brush} clearSignal={clearSignal} canDraw={canDraw} turnId={room.turn?.id ?? 0} />
            <CanvasOverlay room={room} meId={meId} />
          </div>
          {canDraw && <Toolbar brush={brush} onChange={setBrush} onClear={() => setClearSignal((n) => n + 1)} />}
        </div>

        {/* Chat: fixed height on mobile, matches the canvas column on desktop */}
        <section className="order-2 h-80 lg:relative lg:order-3 lg:h-auto">
          <div className="h-full lg:absolute lg:inset-0">
            <Chat disabledReason={chatDisabled} placeholder={chatPlaceholder} />
          </div>
        </section>
      </div>
    </div>
  );
}
