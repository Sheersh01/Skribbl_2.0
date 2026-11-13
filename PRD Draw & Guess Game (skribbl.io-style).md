# PRD: Draw & Guess Game (skribbl.io-style)

Nov 13, 2026 · @Sheersh Saxena

## Overview

Build a free, browser-based multiplayer draw-and-guess game that matches skribbl.io's core loop and look, then wins players with new game modes, better drawing tools and modern social features. Working title: TBD.

**Problem.** skribbl.io (released 2017 by developer ticedev) is the default draw-and-guess game for casual groups. Player critiques describe it as one core mode with a small tool set, little chat moderation, and scoring that favors the fastest guesser over the drawer. Players who want variety drift to gartic.io, Gartic Phone, Sketchful.io and Drawasaurus, which splits the audience.

**Vision.** The default place to play draw-and-guess online: familiar within 10 seconds, deep enough to keep playing for months.

**Why now.** Demand is proven: skribbl.io holds a 9.0 rating from about 6.6k votes on CrazyGames. Its loop is simple to clone, so the win has to come from modes, polish, retention and trust, not from the loop itself.

## Goals and non-goals

v1 ships full parity with the original's core experience plus three new modes and a stronger toolset. Targets below are proposed starting hypotheses, not validated numbers.

**Goals**

1. **Parity.** Every P0 feature in the parity table is live at launch.
2. **Differentiation.** At least 3 new game modes and 5 new features at launch (see New game modes and New features).
3. **Speed to play.** Landing page to first round in 15 seconds or less, no sign-up.
4. **Fairer scoring.** Drawer rewards and anti-griefing rules that fix the common critiques of the original.
5. **Trust.** Chat and drawing moderation on from day one.

**Non-goals (v1)**

- Native iOS or Android apps. A responsive web app and PWA cover mobile.
- Voice or video chat.
- Copying the original's name, logo, avatar art, UI assets or word lists. "Same look" means the same layout conventions and playful tone, drawn from scratch.
- AI-generated drawings standing in for human players.
- Real-money wagering or crypto features.

## Target users

Primary audience is casual friend groups on desktop and phone; public-lobby strangers fill the long tail.

| Persona | Need | What serves them |
| --- | --- | --- |
| Friend group (primary) | Spin up a private room in seconds, tweak rules, play 20+ minutes | Link and code invites, host settings, custom words, new modes |
| Public-lobby player | Fast match, fair rounds, no toxicity | Quick play by language, chat filter, vote-kick, anti-grief rules |
| Streamer or community | Audience participation, repeat events | Spectator mode, OBS-friendly view, tournament mode, room codes |
| Teacher or trainer | Vocabulary or topic games, safe for minors | Custom word packs, kid-safe filter, host controls, no sign-up |
| Party or office host | Mixed-skill group, quick rules | Team mode, short blitz rounds, mobile support |

## Parity features (v1 must match)

The original's loop: one player picks a word and draws, everyone else guesses in chat, faster guesses score more, and the highest total after all rounds wins. All rows below are P0 unless marked. Setting ranges differ between secondary sources, so treat numbers as approximate and confirm by playing the live game before locking specs.

| Area | Baseline behavior to match | Note |
| --- | --- | --- |
| Rooms | Public quick-play and private rooms joined by link or code | Private rooms are where most friend groups play |
| Players | 2 to 12 per room by default; sources report up to 20 in private rooms | Pick a cap in the open questions |
| Room settings | Language, max players, draw time, rounds, word count, hints, word mode, custom words | Draw time default about 80 s; rounds 2 to 10; word choices 1 to 5; hints 0 to 5 |
| Word modes | Normal, hidden (letters masked), combination |  |
| Custom words | Host pastes a comma-separated list; option to use only custom words | Enforce min and max counts and word length |
| Languages | Roughly 28 word-list languages | Launch with top 8, add more in P1 |
| Turn flow | Drawer picks 1 of 3 words; everyone else guesses in chat until time ends or all guess |  |
| Hints | Letters of the word are revealed progressively as the timer runs down | Drawer cannot write text on canvas |
| Guess feedback | Correct guessers turn green, their guess is hidden from others; chat shows the event | Close-guess nudge is P1 |
| Scoring | Faster correct guess scores more; drawer scores from how many and how fast others guess | See fairer scoring under New features |
| Scoreboard | Live scores, end-of-round recap, final ranking |  |
| Canvas tools | Pencil, fill, eraser, undo, clear, color palette, brush sizes |  |
| Timer | Visible countdown above the canvas |  |
| Avatars | Customizable cartoon avatar per player | Must be original art |
| Moderation basics | Vote-kick, mute, report | Strengthened under New features |
| Look and feel | Hand-drawn cartoon style, bright palette, simple three-panel layout: players, canvas, chat | Same conventions, original assets |

## New game modes

Three modes ship at launch (L1) alongside classic; the rest follow in two later waves. Each mode reuses the same room, canvas and chat stack so cost per mode stays low.

| Mode | How it plays | Why it matters | Release |
| --- | --- | --- | --- |
| Classic | The original loop, with fairer scoring | Parity anchor | L1 |
| Teams | 2 to 4 teams; the drawer's team guesses, scores are shared; optional steal when the other team guesses late | Party and office groups; fixes cold 1-vs-all feel | L1 |
| Blitz | 30 s turns, 1 hint, small word pool, bonus for streaks | Short sessions, mobile-friendly | L1 |
| Impostor | One guesser secretly lacks the word and must blend into a shared canvas; others vote them out | Social deduction hook; high replay value with friends | L1 |
| Telephone | Write, draw, then describe in a chain; reveal shows how the idea mutated | Proven viral format in the category | Wave 2 |
| Collab | Everyone draws on one canvas with assigned colors or a stroke budget; rest guess | Pulls non-artists in | Wave 2 |
| Blind Draw | Drawer's canvas is hidden for part of the turn, then revealed | Comedy mode for streamers | Wave 2 |
| Limited Ink | Fixed ink budget, no undo | Rewards clever, minimal drawings | Wave 2 |
| Caption It | Everyone sees a finished odd drawing and writes a caption; room votes | Works for players who dislike drawing | Wave 3 |
| Daily Challenge | Same word set for everyone each day, async leaderboard | Retention loop, solo-friendly | Wave 3 |
| Tournament | Brackets or leagues across rooms with spectators | Communities and streamers | Wave 3 |

## New features

Nine features ship at launch (L1) because they fix the most common complaints about the original or make the game feel current; the rest are phased.

| Feature | What it adds | Release |
| --- | --- | --- |
| Fairer scoring | Drawer score scales with the share of players who guess; optional thumbs-up from guessers gives the drawer a bonus; word difficulty tags add a multiplier; cleaner rounded point values | L1 |
| Anti-grief rules | Blank-canvas or idle-drawer detection warns, then skips the turn and withholds the drawer's points; chat spam limits | L1 |
| Stronger toolset | Redo, shapes (line, rectangle, ellipse), eyedropper, custom colors, more brush sizes, stylus pressure, zoom and pan | L1 |
| Gallery and replay | Every drawing saved for the session; timelapse replay; download or share as image or short clip; room votes for best drawing | L1 |
| Moderation suite | Chat filter with kid-safe default, report and mute, vote-kick, snapshot review of reported drawings | L1 |
| Mobile and PWA | Touch-first canvas, responsive layout, installable app shell | L1 |
| Accessibility | Colorblind-safe palettes, reduced-motion option, keyboard-first chat, screen-reader labels on all non-canvas UI | L1 |
| Reconnect and host transfer | Rejoin within 60 s without losing score; host leaving hands control to the next player | L1 |
| Waiting room | Round starts only when the minimum player count is reached, with a ready check | L1 |
| Optional accounts | Guest play by default; sign in to keep stats, avatar, friends and saved word packs | Wave 2 |
| Community word packs | Create, rate, share and import packs by CSV; difficulty and age tags | Wave 2 |
| Spectator mode | Watch full or in-progress rooms; emoji reactions during play | Wave 2 |
| Progression | XP, achievements, cosmetic unlocks earned by playing, never sold as advantages | Wave 3 |
| Streamer tools | Clean overlay view for OBS, room code sharing, audience-vote hooks | Wave 3 |

## Functional requirements

P0 blocks launch. P1 targets launch and may slip up to four weeks. P2 is post-launch.

| ID | Requirement | Acceptance criterion | Pri |
| --- | --- | --- | --- |
| FR-1 | Create or join a room by link or short code | Join in 3 clicks or fewer; link opens straight to the lobby | P0 |
| FR-2 | Quick play into a public room by language | Median match time 10 s or less | P0 |
| FR-3 | Host room settings matching parity table | All settings editable before start, locked mid-game | P0 |
| FR-4 | Server-authoritative turn engine | Word choice auto-picks after 15 s; timer cannot be spoofed by clients | P0 |
| FR-5 | Real-time canvas sync | Late joiners receive the full canvas; strokes stay in order | P0 |
| FR-6 | Guess validation on the server | Case and accent insensitive; correct guesses hidden from other guessers | P0 |
| FR-7 | Progressive letter hints | Reveal schedule follows the hint setting | P0 |
| FR-8 | Scoring v2 | Formulas documented; drawer score scales with guess share; thumbs bonus applied | P0 |
| FR-9 | Core canvas tools | Pencil, fill, eraser, undo, clear, palette, brush sizes | P0 |
| FR-10 | Teams, Blitz and Impostor modes | Each playable end to end; Impostor role never exposed to client until reveal | P0 |
| FR-11 | Moderation baseline | Chat filter, vote-kick, mute, report; blank-canvas detection | P0 |
| FR-12 | Reconnect and host transfer | Rejoin within 60 s keeps slot and score | P0 |
| FR-13 | Extended canvas tools | Redo, shapes, eyedropper, custom colors, stylus pressure, zoom | P1 |
| FR-14 | Gallery and replay | Timelapse plays for every drawing in the session; image download works | P1 |
| FR-15 | Accessibility baseline | WCAG 2.2 AA for all non-canvas UI; colorblind palettes | P1 |
| FR-16 | Localization | 8 languages for UI and word lists at launch | P1 |
| FR-17 | Spectator mode and reactions | Viewer joins any room without affecting scores | P1 |
| FR-18 | Optional accounts and saved word packs | Guest play never requires sign-in | P1 |
| FR-19 | Cosmetic shop and supporter pass | No gameplay advantage from purchases | P2 |
| FR-20 | Streamer overlay and tournament brackets | Overlay renders without chat or ads | P2 |

## Non-functional requirements

The game lives or dies on how drawing feels in real time. Targets are proposed and should be validated in a load test before launch.

| Area | Target |
| --- | --- |
| Stroke latency | p95 of 150 ms or less from drawer to guessers within one region |
| Local drawing | 60 fps on a mid-range phone; no dropped input |
| Join time | Room link to playable lobby in 3 s or less on a 4G connection |
| Initial load | 1.5 MB or less gzipped, first interactive under 3 s on mid-range mobile |
| Scale at launch | 10,000 concurrent players; architecture sized for 10x |
| Availability | 99.5% monthly for game servers |
| Cheating | Words, roles and scores live only on the server; clients get reveals when allowed |
| Accessibility | WCAG 2.2 AA for all non-canvas UI |
| Privacy | GDPR and COPPA aware; no personal data required to play; no DMs in v1 |
| Browser support | Latest two versions of Chrome, Safari, Firefox and Edge; iOS Safari and Android Chrome |

## Technical approach

&#91;embedded content: proposed architecture · 4 layers\]

Proposed design: the game service holds words, roles, timers and scores, and clients only render and send input, so a modified client cannot see the word or fake a score.

- Strokes travel as compact point deltas with sequence numbers; the server keeps the full list so late joiners and replays rebuild the canvas exactly.
- Each room runs on one game-service instance, with live state in the state store so a room can recover after a restart.
- One region at launch; regional clusters once latency data justifies them.
- The canvas uses 2D drawing with pointer events for mouse, touch and stylus; the same engine drives replay and gallery.
- One shared engine powers every mode: a mode is a rule set plus a scoring function, not a separate service.

## Moderation, safety and monetization

Trust is a product feature here: strangers draw and type in the same room, and the original draws criticism for light chat controls. Monetization stays cosmetics-only so the game stays free and fair.

**Safety**

- Chat filter on by default, stricter in kid-safe rooms and for custom words flagged as adult.
- Report button on players, chat lines and finished drawings; reported drawings are snapshotted for review.
- Automated checks on canvas snapshots for explicit content, with auto-skip and a strike on the drawer.
- Vote-kick, mute, and host-only kick in private rooms.
- Age gate at first visit; under-13 play limited to private rooms with filters forced on.
- No private messages and no links in chat in v1.

**Monetization**

- Free to play with no gameplay advantage ever sold.
- Cosmetic shop: avatar parts, brush skins, canvas themes.
- Supporter pass: ad-free, extra cosmetics, bigger private rooms.
- Light, non-intrusive ads only between games, never during a turn; kid-safe rooms show none.

## Success metrics

Success means people come back and use the new modes, not just that they try the game once. All targets are starting hypotheses to calibrate after the first month of data.

| Metric | Target | Window |
| --- | --- | --- |
| Time from landing to first round | 15 s or less, median | Launch |
| Day-1 retention | 35% or more | First 90 days |
| Day-7 retention | 15% or more | First 90 days |
| Games per session | 2 or more | First 90 days |
| Share of games in new modes | 30% or more | 60 days after launch |
| Private-room share of games | 40% or more | First 90 days |
| Reports per 100 games | Under 2 | Ongoing |
| Turns skipped for griefing | Under 3% | Ongoing |
| Crash-free sessions | 99.5% or more | Ongoing |

## Roadmap

&#91;embedded content: roadmap · 4 phases, 3 gates\]

Four phases in order, each unlocked by a gate that reuses a target from the metrics and requirements sections. Calendar dates depend on team size, so set them once the team is sized.

## Risks, legal and open questions

The biggest risks are cold-start lobbies and copying too closely; both are manageable if planned for now.

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Trademark or copyright overlap with skribbl.io | Takedown, rebrand cost | Original name, logo, avatars, UI art and word lists; copy only generic layout conventions; legal review before launch |
| Empty public lobbies at launch | Players leave in seconds | Seed with friendly bots, match by language, launch through communities and private-room invites first |
| Toxic chat or offensive drawings | Brand damage, minor safety | Filters, reports, snapshot review, kid-safe default, strikes |
| Drawer griefing and score gaming | Unfair rounds | Anti-grief rules and scoring v2 from day one |
| Realtime infrastructure cost | Margin squeeze | Compact stroke encoding, regional servers, idle-room reaping |
| Scope creep from many modes | Late launch | Three launch modes only; shared engine; waves 2 and 3 gated by retention |
| Incumbent network effect | Slow growth | Differentiate on modes and trust, not on matching the loop alone |

**Open questions**

- Name and brand identity, cleared against the original's marks.
- Player cap: 12 or up to 20 per room.
- Accounts: guest-only at launch or optional sign-in on day one.
- Word lists: write originals in-house, license, or lean on community packs; which languages first.
- Ads at launch: yes or no.
- Hosting: one global region or regional clusters from the start.
- Verify the original's current features, limits and update history against the live game before writing positioning copy; the claim that it has not been updated in years was not checked here.

## Sources

Search results retrieved 13 Nov 2026; pages were not opened individually, so figures marked approximate should be confirmed in the live game.

- [Mechanics of Magic: skribbl.io settings and scoring](https://mechanicsofmagic.com/?p=17118)
- [Mechanics of Magic: rounds, hints, players](https://mechanicsofmagic.com/?p=6800)
- [Critical Play: drawer scoring](https://mechanicsofmagic.com/2024/04/24/critical-play-scribbl-io-2/)
- [Critical Play: blank-canvas strategy](https://mechanicsofmagic.com/?p=985)
- [Critical Play: waiting rooms and chat toxicity](https://mechanicsofmagic.com/?p=15988)
- [CrazyGames: skribbl.io listing](https://www.crazygames.com/game/skribblio)
- [AlternativeTo: skribbl alternatives](https://alternativeto.net/software/skribbl/)
- [Skribbl.io alternatives overview](https://sophiecress.com/blog/skribbl-io-alternatives-fun-online)
