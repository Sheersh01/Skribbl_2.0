import { AVATAR_COLORS, type Avatar as AvatarData } from '@skribbl/shared';

interface Props {
  avatar: AvatarData;
  size?: number;
  className?: string;
}

const INK = '#1f2937';

function Eyes({ variant }: { variant: number }) {
  switch (variant) {
    case 1: // big googly
      return (
        <g>
          <circle cx="36" cy="46" r="10" fill="#fff" stroke={INK} strokeWidth="2.5" />
          <circle cx="64" cy="46" r="10" fill="#fff" stroke={INK} strokeWidth="2.5" />
          <circle cx="38" cy="48" r="4.5" fill={INK} />
          <circle cx="62" cy="48" r="4.5" fill={INK} />
        </g>
      );
    case 2: // happy arcs
      return (
        <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
          <path d="M29 49 Q36 40 43 49" />
          <path d="M57 49 Q64 40 71 49" />
        </g>
      );
    case 3: // sleepy
      return (
        <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
          <path d="M29 47 Q36 52 43 47" />
          <path d="M57 47 Q64 52 71 47" />
        </g>
      );
    default: // dots
      return (
        <g>
          <circle cx="37" cy="46" r="5.5" fill={INK} />
          <circle cx="63" cy="46" r="5.5" fill={INK} />
          <circle cx="39" cy="44" r="1.8" fill="#fff" />
          <circle cx="65" cy="44" r="1.8" fill="#fff" />
        </g>
      );
  }
}

function Mouth({ variant }: { variant: number }) {
  switch (variant) {
    case 1: // open
      return (
        <g>
          <ellipse cx="50" cy="69" rx="9" ry="7" fill={INK} />
          <ellipse cx="50" cy="73" rx="5" ry="3" fill="#f87171" />
        </g>
      );
    case 2: // grin
      return <path d="M35 63 Q50 82 65 63 Z" fill={INK} stroke={INK} strokeWidth="2" strokeLinejoin="round" />;
    case 3: // surprised
      return <circle cx="50" cy="69" r="4.5" fill="none" stroke={INK} strokeWidth="3.5" />;
    default: // smile
      return <path d="M38 65 Q50 76 62 65" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
  }
}

/** Original blob-buddy avatar, drawn in SVG. */
export function Avatar({ avatar, size = 48, className }: Props) {
  const color = AVATAR_COLORS[avatar.color] ?? AVATAR_COLORS[0];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <ellipse cx="50" cy="94" rx="30" ry="4" fill="rgba(0,0,0,0.15)" />
      <path
        d="M50 12 C78 12 90 34 90 56 C90 80 72 90 50 90 C28 90 10 80 10 56 C10 34 22 12 50 12 Z"
        fill={color}
        stroke={INK}
        strokeWidth="3"
      />
      <ellipse cx="34" cy="26" rx="10" ry="5" fill="rgba(255,255,255,0.45)" transform="rotate(-25 34 26)" />
      <circle cx="25" cy="60" r="5" fill="rgba(255,105,135,0.35)" />
      <circle cx="75" cy="60" r="5" fill="rgba(255,105,135,0.35)" />
      <Eyes variant={Math.floor(avatar.face / 4) % 4} />
      <Mouth variant={avatar.face % 4} />
    </svg>
  );
}
