import { useState, type FormEvent } from 'react';
import { NAME_MAX_LENGTH, type Profile } from '@skribbl/shared';
import { AvatarPicker } from '../components/AvatarPicker';
import { Logo } from '../components/Logo';
import { navigate } from '../lib/route';
import { loadProfile } from '../lib/storage';
import { createRoom, joinRoom, useGame } from '../store';

const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);

export function Home({ routeCode }: { routeCode: string | null }) {
  const notice = useGame((s) => s.notice);
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ready = (): Profile | null => {
    const name = profile.name.trim();
    if (!name) {
      setError('Pick a name first.');
      return null;
    }
    setError(null);
    return { ...profile, name };
  };

  const onJoinLink = (e: FormEvent) => {
    e.preventDefault();
    const p = ready();
    if (p && routeCode) joinRoom(routeCode, p);
  };

  const onCreate = () => {
    const p = ready();
    if (p) createRoom(p);
  };

  const onJoinCode = (e: FormEvent) => {
    e.preventDefault();
    const p = ready();
    if (!p) return;
    if (codeInput.length !== 5) return setError('Room codes have 5 letters.');
    joinRoom(codeInput, p);
  };

  const message = error ?? notice;

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-6 p-4">
      <Logo size="lg" />

      <div className="w-full rounded-3xl bg-white p-5 shadow-xl">
        <AvatarPicker value={profile.avatar} onChange={(avatar) => setProfile((p) => ({ ...p, avatar }))} />

        <label className="mt-4 block">
          <span className="sr-only">Your name</span>
          <input
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            maxLength={NAME_MAX_LENGTH}
            placeholder="Your name"
            autoFocus
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-lg font-semibold outline-none focus:border-indigo-400"
          />
        </label>

        {message && (
          <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-center text-sm font-medium text-rose-700">
            {message}
          </p>
        )}

        {routeCode ? (
          <form onSubmit={onJoinLink} className="mt-4 flex flex-col gap-2">
            <button className="w-full rounded-xl bg-green-500 py-3 text-xl font-bold text-white shadow-[0_4px_0_#15803d] hover:bg-green-400 active:translate-y-0.5 active:shadow-[0_2px_0_#15803d]">
              Join room {routeCode}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              or create your own room
            </button>
          </form>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={onCreate}
              className="w-full rounded-xl bg-green-500 py-3 text-xl font-bold text-white shadow-[0_4px_0_#15803d] hover:bg-green-400 active:translate-y-0.5 active:shadow-[0_2px_0_#15803d]"
            >
              Create private room
            </button>
            <form onSubmit={onJoinCode} className="flex gap-2">
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(cleanCode(e.target.value))}
                placeholder="Room code"
                aria-label="Room code"
                className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-center font-semibold tracking-[0.3em] uppercase outline-none focus:border-indigo-400"
              />
              <button className="rounded-xl bg-indigo-500 px-5 font-bold text-white shadow-[0_4px_0_#3730a3] hover:bg-indigo-400 active:translate-y-0.5 active:shadow-[0_2px_0_#3730a3]">
                Join
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
