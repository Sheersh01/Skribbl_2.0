# Draw & Guess — MVP Plan (solo, friends-only)

Goal: a playable draw-and-guess game I can run for my friends and see how it feels.
Not built for scale. The full PRD (`PRD Draw & Guess Game (skribbl.io-style).md`) stays as the "if this works" vision.

**Success = one evening of fun games with 4–8 friends, without crashes or desyncs.**

---

## 1. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Language | TypeScript everywhere | One language; shared types between client and server |
| Repo | npm workspaces: `client/`, `server/`, `shared/` | Protocol types and constants defined once |
| Server | Node 22 + Express + Socket.IO 4 | Rooms, reconnection and acks built in; simple to reason about |
| State | In-memory `Map<roomCode, Room>` | No DB needed; a restart ends games, which is fine for friends |
| Client | React + Vite | Fast dev loop; React for UI, canvas handled imperatively |
| Styling | Tailwind CSS | Quick to get a bright, playful look |
| Canvas | HTML Canvas 2D + Pointer Events | Mouse, touch and stylus with one code path |
| Tests | Vitest on the game engine | The engine is pure logic and easy to test |
| Hosting | One Node service serving the built client (Render / Railway / Fly.io) | One deploy, WebSockets supported. For quick tests: run locally + Cloudflare Tunnel |

**Key rule:** the game engine (`server/src/engine/`) is plain functions and classes with **no Socket.IO imports**.
The socket layer only translates events to engine calls and broadcasts results. That keeps it testable and makes new modes "a rule set + a scoring function".

---

## 2. MVP scope

**In**
- Create a private room → shareable link / 5-letter code; join with name + simple original avatar (color + face variant)
- Lobby with host settings: rounds (2–10, default 3), draw time (30–180 s, default 80), word choices (1–5, default 3), hints (0–5, default 2), max players (default 12), custom words + "custom only"
- Turn flow: drawer picks a word (15 s auto-pick) → draws → others guess in chat
- Hints: letters revealed progressively
- Guessing: case/accent-insensitive; correct guess hidden; "close!" nudge
- Canvas: pen, eraser, fill, ~16-color palette, 4 brush sizes, undo, clear
- Scoring v2 (below), live scoreboard, turn reveal, end-of-game podium, "play again"
- Reconnect within 60 s keeps slot and score; host transfer when host leaves
- English word list (~300–500 original words, hand-written JSON)

**Out (for now)**: public rooms, accounts, moderation beyond host-kick, PWA, i18n, ads, gallery/replay, analytics, load targets.

**Experiments after MVP** (each = settings preset or small rule set): Blitz → Teams → Impostor.

---

## 3. Room state machine

```
LOBBY ──host starts (≥2 players)──▶ CHOOSING ──word picked / 15 s──▶ DRAWING
  ▲                                     ▲                               │
  │                                     │ next drawer                   │ all guessed / time up / drawer left
  │                                     └──────────── TURN_END (5 s) ◀──┘
  │                                                       │ last drawer of last round
  └────────── "play again" ◀────────── GAME_END (podium) ◀┘
```

- Drawer order: join order, each player draws once per round.
- Players who join mid-game are added to the end of the order and start at 0 points.
- Drawer disconnects during CHOOSING → skip to the next drawer. During DRAWING → turn ends immediately; guessers keep the points they already earned, the drawer gets none.
- Players drop below 2 → return to LOBBY (scores kept on screen).
- Empty room deleted after 5 minutes.
- All timers live on the server; clients get `phaseEndsAt` timestamps and render the countdown.

---

## 4. Scoring v2 (starting values — tune after playtesting)

Let `T` = draw time, `t` = seconds left when guessed, `G` = number of guessers (players minus drawer), `c` = how many guessed correctly.

- **Guesser:** `round5(100 + 200 * t / T)` → 100–300 points, faster = more
- **Order bonus:** first correct guesser +50
- **Drawer:** `round5(250 * c / G)` → 0 if nobody guesses, 250 if everyone does
- **Thumbs-up:** after the turn, each guesser can give the drawer 👍 → +15 each (one per player per turn)

`round5` = round to the nearest 5.

---

## 5. Guessing rules

- Normalize: lowercase → strip accents (NFD) → trim → collapse spaces → treat `-` as space.
- Exact match → correct. Guess is not shown to others; chat shows "**Alex guessed the word!**".
- Levenshtein distance 1 (words ≥ 4 letters) → private "*'xyz' is close!*" to that player only.
- After guessing correctly, a player's messages are visible only to the drawer and other correct guessers.
- Drawer cannot chat during DRAWING.
- Word shown to guessers as blanks: `_ _ _ _   _ _ _` (spaces between words shown).

**Hints:** with `h` hints, reveal one random letter at `T * i / (h + 1)` for `i = 1..h`, never revealing more than half the letters.

---

## 6. Canvas sync

- Fixed logical canvas: **800 × 600**. All coordinates are integers in that space; the client scales to fit the screen (and handles devicePixelRatio).
- Drawing ops:
  - `stroke`: `{ id, tool: 'pen'|'eraser', color, size, points: [x0,y0,x1,y1,...] }` — the drawer sends point batches every ~40 ms with the same `id`
  - `fill`: `{ id, x, y, color }` — each client runs the flood fill locally (use a color tolerance of ~32 to absorb anti-aliasing differences)
  - `clear`
- Server keeps the ordered op list for the current turn.
  Late joiners / reconnects receive it and replay it.
- Undo: server removes the last op `id`; clients redraw everything from the op list.
  If redraw gets slow, cache a bitmap snapshot every N ops.
- Only the current drawer's draw events are accepted by the server.

---

## 7. Socket protocol (initial)

Client → server
| Event | Payload |
| --- | --- |
| `room:create` | `{ name, avatar }` → ack `{ code, sessionId }` |
| `room:join` | `{ code, name, avatar, sessionId? }` → ack `{ ok, sessionId }` or error |
| `room:settings` | partial settings (host, LOBBY only) |
| `room:kick` | `{ playerId }` (host) |
| `game:start` | — (host) |
| `turn:chooseWord` | `{ index }` (drawer) |
| `draw:op` | stroke batch / fill / clear (drawer) |
| `draw:undo` | — (drawer) |
| `chat:send` | `{ text }` |
| `turn:thumbsUp` | — |

Server → client
| Event | Payload |
| --- | --- |
| `room:state` | Full state snapshot **sanitized per player** (word only for drawer / correct guessers, otherwise hint mask) |
| `turn:wordChoices` | `{ words }` (drawer only) |
| `draw:op` / `draw:undo` / `draw:sync` | Ops broadcast; full op list on join |
| `chat:message` | `{ kind: 'chat'|'system'|'correct'|'close', from?, text }` |

Simple approach: send a fresh `room:state` snapshot on every state change (tiny with ≤12 players). Draw ops go on their own events because they are frequent.

`sessionId` is stored in `localStorage` and lets a reconnecting player reclaim their slot within 60 s.

---

## 8. Folder structure

```
skribbl/
  package.json            # workspaces
  shared/src/             # types.ts, protocol.ts, constants.ts
  server/src/
    index.ts              # express + socket.io bootstrap, serves client/dist in prod
    socket.ts             # event handlers -> engine calls
    rooms.ts              # room registry, cleanup
    engine/
      Room.ts             # state machine, timers
      scoring.ts
      hints.ts
      guess.ts            # normalize, match, close-guess
      words.ts
    words/en.json
    engine/*.test.ts
  client/src/
    pages/Home.tsx  Lobby.tsx  Game.tsx
    components/Canvas.tsx  Toolbar.tsx  Chat.tsx  PlayerList.tsx  WordBar.tsx  Timer.tsx
    canvas/renderer.ts  floodFill.ts
    socket.ts  store.ts
```

---

## 9. Milestones

1. **Shared canvas** — two browser tabs draw on the same canvas in real time (pen, colors, sizes, eraser, clear). ✅
2. **Rooms & lobby** — create/join by link or code, player list, host settings, start button, reconnect, host transfer. ✅
3. **Game loop** — word choice, timer, guessing, hints, close-guess, chat, scoring, turn/round/game end, podium. ✅
4. **Feel** — fill, undo, thumbs-up, sounds, polish from first playtests.
5. **Play it** — deploy (or tunnel), play with friends, write down what felt off.
6. **Experiment** — Blitz, then Teams, then Impostor.
