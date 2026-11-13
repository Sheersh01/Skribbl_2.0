import { Room, type RoomHooks } from './Room';

// No I/O/0/1 so codes are easy to read aloud.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 5;

export function randomCode(): string {
  let s = '';
  for (let i = 0; i < CODE_LENGTH; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}

export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z]{5}$/.test(code) ? code : null;
}

export class RoomRegistry {
  private rooms = new Map<string, Room>();

  constructor(private readonly hooks: Pick<RoomHooks, 'onChange' | 'onChat'>) {}

  create(): Room {
    let code = randomCode();
    while (this.rooms.has(code)) code = randomCode();
    const room = new Room(code, {
      onChange: this.hooks.onChange,
      onChat: this.hooks.onChat,
      onEmpty: (r) => {
        r.dispose();
        this.rooms.delete(r.code);
      },
    });
    this.rooms.set(code, room);
    return room;
  }

  get(code: string | null | undefined): Room | undefined {
    return code ? this.rooms.get(code) : undefined;
  }

  get size(): number {
    return this.rooms.size;
  }
}
