import { Logo } from './components/Logo';
import { useRouteCode } from './lib/route';
import { Game } from './pages/Game';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { useGame } from './store';

export default function App() {
  const routeCode = useRouteCode();
  const status = useGame((s) => s.status);
  const room = useGame((s) => s.room);
  const meId = useGame((s) => s.session?.playerId);

  if (status === 'joining') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4">
        <Logo size="lg" />
        <p className="animate-pulse text-lg font-semibold text-white/80">Joining…</p>
      </div>
    );
  }

  if (room && meId) {
    return room.phase === 'lobby' ? <Lobby room={room} meId={meId} /> : <Game room={room} meId={meId} />;
  }

  return <Home routeCode={routeCode} />;
}
