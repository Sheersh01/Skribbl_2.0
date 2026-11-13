import { useState } from 'react';
import type { RoomState } from '@skribbl/shared';
import { Chat } from '../components/Chat';
import { PlayerList } from '../components/PlayerList';
import { RoomHeader } from '../components/RoomHeader';
import { SettingsPanel } from '../components/SettingsPanel';
import { startGame } from '../store';

function InviteCard({ code }: { code: string }) {
  const link = `${window.location.origin}/r/${code}`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API needs https (or localhost); fall back to selecting the text.
      (document.getElementById('invite-link') as HTMLInputElement | null)?.select();
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-lg">
      <h2 className="mb-2 text-lg font-bold text-slate-800">Invite friends</h2>
      <div className="flex gap-2">
        <input
          id="invite-link"
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-xl bg-indigo-500 px-4 font-bold text-white hover:bg-indigo-400"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        or share the code <span className="font-bold tracking-widest text-slate-800">{code}</span>
      </p>
    </div>
  );
}

export function Lobby({ room, meId }: { room: RoomState; meId: string }) {
  const isHost = room.hostId === meId;
  const connected = room.players.filter((p) => p.connected).length;
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const host = room.players.find((p) => p.id === room.hostId);

  const onStart = async () => {
    setStarting(true);
    const res = await startGame();
    setStarting(false);
    setError(res.ok ? null : res.error);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-3 sm:p-6">
      <RoomHeader code={room.code} />

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl bg-white p-3 shadow-lg">
            <h2 className="mb-2 px-1 text-lg font-bold text-slate-800">
              Players <span className="text-slate-400">{room.players.length}/{room.settings.maxPlayers}</span>
            </h2>
            <PlayerList room={room} meId={meId} />
          </section>
          <div className="h-64">
            <Chat placeholder="Say hi…" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <InviteCard code={room.code} />

          <section className="rounded-2xl bg-white p-4 shadow-lg">
            <h2 className="mb-3 text-lg font-bold text-slate-800">
              Settings {!isHost && <span className="text-sm font-normal text-slate-500">(host only)</span>}
            </h2>
            <SettingsPanel settings={room.settings} editable={isHost} playerCount={room.players.length} />

            <div className="mt-4">
              {error && <p role="alert" className="mb-2 text-center text-sm font-medium text-rose-600">{error}</p>}
              {isHost ? (
                <button
                  type="button"
                  onClick={onStart}
                  disabled={connected < 2 || starting}
                  className="w-full rounded-xl bg-green-500 py-3 text-xl font-bold text-white shadow-[0_4px_0_#15803d] hover:bg-green-400 active:translate-y-0.5 active:shadow-[0_2px_0_#15803d] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-[0_4px_0_#94a3b8]"
                >
                  {connected < 2 ? 'Waiting for players…' : 'Start game'}
                </button>
              ) : (
                <p className="rounded-xl bg-slate-100 py-3 text-center font-semibold text-slate-600">
                  Waiting for {host?.name ?? 'the host'} to start…
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
