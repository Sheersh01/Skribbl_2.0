export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-5xl sm:text-6xl' : 'text-2xl sm:text-3xl';
  return (
    <h1 className={`${cls} font-bold tracking-wide text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]`}>
      Draw <span className="text-yellow-300">&</span> Guess
    </h1>
  );
}
