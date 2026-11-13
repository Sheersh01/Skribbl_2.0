import { AVATAR_COLOR_COUNT, AVATAR_FACE_COUNT, type Avatar as AvatarData } from '@skribbl/shared';
import { randomAvatar } from '../lib/storage';
import { Avatar } from './Avatar';

interface Props {
  value: AvatarData;
  onChange: (a: AvatarData) => void;
}

const wrap = (n: number, max: number) => (n + max) % max;

function Arrow({ dir, label, onClick }: { dir: 'left' | 'right'; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700 hover:bg-indigo-200"
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  );
}

export function AvatarPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex flex-col gap-2">
        <Arrow dir="left" label="Previous color" onClick={() => onChange({ ...value, color: wrap(value.color - 1, AVATAR_COLOR_COUNT) })} />
        <Arrow dir="left" label="Previous face" onClick={() => onChange({ ...value, face: wrap(value.face - 1, AVATAR_FACE_COUNT) })} />
      </div>
      <div className="relative">
        <Avatar avatar={value} size={112} />
        <button
          type="button"
          aria-label="Random avatar"
          title="Random"
          onClick={() => onChange(randomAvatar())}
          className="absolute -right-1 -bottom-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow hover:scale-110"
        >
          🎲
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <Arrow dir="right" label="Next color" onClick={() => onChange({ ...value, color: wrap(value.color + 1, AVATAR_COLOR_COUNT) })} />
        <Arrow dir="right" label="Next face" onClick={() => onChange({ ...value, face: wrap(value.face + 1, AVATAR_FACE_COUNT) })} />
      </div>
    </div>
  );
}
