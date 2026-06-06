# WARDBOUND — UI / HUD Design

> In a flick game the HUD *is* the gameplay — if the player (and the spectator) can't read the beat,
> the element, and the timing at a glance, nothing else matters. Clarity is the prime directive.

> 🎨 **Live Figma mockup of the combat HUD:**
> https://www.figma.com/design/VqqruU7nrIDIXfSZkiRW5W
> (Built from the spec below, using the canonical element colours from ART_BIBLE.md. Open to edit/iterate.)

## 1. Principles

1. **The beat is unmissable.** The Knell pulse is the most prominent element on screen — visual + audio + (optional) haptic.
2. **One-glance reads.** Element, landing beat, your Aether, your Resolve, and your Vigor must all parse in a fraction of a second.
3. **Color + shape, never color alone.** Every element has a hue *and* an icon shape (colorblind-safe).
4. **Spectator-legible.** A viewer with no context should understand the drama. (This is marketing.)
5. **Juice serves clarity.** Effects amplify reads (a Perfect *snaps*); they never bury them.
6. **Mobile-first ergonomics.** Wards reachable by thumbs; nothing critical in screen corners.

## 2. Combat HUD — desktop layout (ASCII mock)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ENEMY: Tempestrix  [Storm]                         Vigor ▰▰▰▰▰▰▱▱ 74% │
│                                                                        │
│                      ( enemy Wraith art )                              │
│                                                                        │
│   TELEGRAPH LANE  (time flows right → left toward the NOW line)        │
│   incoming:   [⚡Storm]      [🜂Ember·feint]   [⚡⚡Storm·split]         │
│   ───────────────┊──────────────┊─────────────┊────────►| NOW |       │
│                  3 beats        2 beats        1 beat     ‖land        │
│                                                                        │
│                      ( your Wraith art )                               │
│                                                                        │
│  YOU: Cindreaver [Ember]                            Vigor ▰▰▰▰▰▰▰▱ 88% │
│                                                                        │
│   ●  THE KNELL  ●            <- big central pulse, beats every 600ms   │
│                                                                        │
│  AETHER ▰▰▰▰▰▰▰▱▱▱ 71%        RESOLVE ▰▰▰▰▰▱▱▱▱▱ 55%  ► [STRIKE ready] │
│                                                                        │
│  WARDS:  [1 🜂Ember] [2 🜄Tide] [3 ⚡Storm] [4 ⛰Stone] [5 🌿Bloom] [6 ❄Frost] │
│          (active ward glows + lifts; on cooldown dims)                  │
│                                                                        │
│  TEAM:  (◆Cindreaver) (○Drippet) (○Cairnling) ( + 3 )   [Q/E to swap]  │
└──────────────────────────────────────────────────────────────────────┘
        on a Perfect:  "PERFECT ✦"  burst at the NOW line + screen snap
```

### Key components
- **Telegraph Lane:** the most important UI. Incoming Strikes scroll toward the **NOW line**; each chip
  shows element (color+icon), wind-up countdown, and markers (`feint`, `split ⚡⚡`, `stack`). This is the
  "sheet music" the player reads.
- **The Knell:** a large central pulse synced to the 600ms tick — the rhythmic anchor; it *breathes*.
- **Ward bar:** six element buttons; the raised Ward glows/lifts for its tick (the visible "flick").
- **Aether / Resolve / Vigor:** clean bars; Aether color-shifts as it nears empty (tension read).
- **Grade feedback:** `PERFECT ✦ / CLEAN / GRAZE / MISS` pops at the NOW line with distinct color, sound,
  and screen-feel. The dopamine delivery system.
- **Team tray + swap prompt.** Momentum, when the enemy has it, shows as a pulsing threat aura on the lane.

## 3. Combat HUD — mobile layout (notes)

```
        ENEMY (top)  +  Vigor
   ── telegraph lane (full width) ──► NOW
        YOUR Wraith
        ● KNELL ●        grade pops here
  [Aether bar]      [Resolve bar / STRIKE]
  ╭───────── WARD THUMB-ZONE ─────────╮
  │  Ember  Tide  Storm                │  (left thumb)
  │              Stone  Bloom  Frost   │  (right thumb)
  ╰────────────────────────────────────╯
       swap = swipe on team dots
```
- Wards split into two thumb clusters; the lane and Knell stay center-screen.
- Larger hit-areas, haptic on every flick + a stronger haptic on Perfect.
- Portrait-first (single-hand-friendly casual mode; two-hand for ranked).

## 4. Spectator / broadcast HUD

- Same lane + Knell (so viewers read the duel), **plus** both players' name/ping/grade-streak and a
  live **Perfect-streak counter** (the "he hasn't been hit in 40 beats!" hype meter).
- Clean, branded, vertical-clip-friendly variant for shorts.

## 5. Out-of-combat UI (quick map)

- **The Sanctuary** = the home screen (your living base; see PROGRESSION.md) — not a sterile menu.
- **Archive/Bestiary**, **Forge** (cosmetics), **Knell-Shrine** (daily/events), **Trial Hall**
  (practice/Trials/replays), **Hunt map** — all diegetic rooms in the Sanctuary.
- **Warden profile:** sigil, rank, rare/Aberrant showcase — your identity, shareable.

## 6. Accessibility (HUD-specific)

- Toggle: high-contrast lane, larger icons, extended telegraph color-blind palettes.
- Cue options: beat-only audio click, off-beat metronome, visual flash, haptic strength.
- Adjustable lane scroll speed in casual (paired with tick speed); ranked locked.
- Subtitles/iconography for all audio-conveyed info — never audio-only.

> Next step for UI: turn this spec into a real visual mockup (Figma) once we lock the art direction —
> see ART_BIBLE.md and the open question to the user about generating concept art.
