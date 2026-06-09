# WARDBOUND — Roadmap

Phased so we **prove fun before we spend money/complexity**. Each phase has a clear "is it working?"
gate before the next.

## Phase 0 — Design & setup *(we are here)*
- [x] Concept, market research, platform/engine decision
- [x] Design doc, tech doc, monetization doc, roadmap
- [ ] Scaffold the project (Vite + Phaser 3 + TypeScript, test runner, repo structure)
- [ ] Define the data format for Wraiths / type chart / balance tables

**Gate:** docs agreed, repo scaffolds and runs a blank scene.

## Phase 1 — The Flick Prototype (prove the core)  🟢 IN PROGRESS
The single most important phase. If this isn't fun, nothing else matters.
- [x] Tick scheduler (fixed 600ms timestep) + visible/audible tick pulse (the Knell)
- [x] One Wraith vs one telegraphing enemy
- [x] Telegraph system (element + wind-up), landing-tick resolution
- [x] Wards: flick to negate, energy (Aether) drain/regen, hit vs negate
- [x] Perfect/Clean/Graze/Miss grading + Momentum
- [x] Resolve meter + a basic Strike back at the enemy
- [x] Difficulty ramp (single → mixed elements → faster → feints)
- [x] Starter-pick screen + win/lose/restart loop
- [x] Engine-agnostic pure-TS combat core + unit tests (14 passing)
- [ ] Tighter juice: screenshake, richer perfect-flick FX, better audio bed
- [ ] Real playtest: *we* find it fun to flick for 5+ minutes; get it in front of a few players
- [ ] Tune the numbers (windows, Aether, damage) against real hands

**Gate:** *we* find it fun to flick for 5+ minutes. Get it in front of a few real players.

> **Run it:** `npm install && npm run dev`. Code map: `src/core/` (engine-agnostic sim, tested),
> `src/game/` (Canvas render, input, audio), `src/data/` (Wraiths). See README "Play the prototype".

## Phase 2 — The Collector Loop  🟢 STARTED
- [x] 2D top-down tile-based **overworld** (explore with arrows/WASD) — programmer-art placeholder
- [x] **Wild encounters**: tall grass → transition into the flick-battle → return to the world
- [x] Dynamic wild Wraith (element-themed) per encounter
- [x] Full 6-element type chart wired into combat (from Phase 1)
- [x] **Binding Rite** — catching as a skill (weaken in battle → tight flick gauntlet → bind meter)
- [x] **Collection + party** that persists (localStorage); switch active Wraith (Tab)
- [x] **Data-driven Wraiths** (~18 species, 6 elements) with stats + **signatures** (Everburn, Riptide, Tempo, Aegis, Wither, Rime, Unmaking)
- [x] **Leveling & Ascension** (XP from wins; evolve at thresholds, e.g. Ashling→Cindreaver→Pyrelich)
- [x] **Mid-battle swap** (Q/E) with per-Wraith Vigor + forced swap on faint
- [x] **Rarity tiers** (common→revenant→mythic) + **Aberrant** "shiny" variants; rarer = longer/harder Rite + weighted spawns
- [x] **Curses** in combat (Sear/Drown/Static/Rime/Sap/Shatter/Unmaking) — attack the flick itself;
      enemies inflict their element's curse on a Miss, scaled by rarity
- [x] **Boss encounter** — the Hollow Shrine summons Voidmoth Mourne (mythic, Unmaking) for a mythic Rite
- [x] **Per-Wraith attack patterns** — element archetypes (Aggressive/Control/Trickster/Wall/Stall/
      Pressure/Unmaking) drive cadence, feints & splits, so each species fights with its own rhythm
- [x] **The Sanctuary (base building)** — earn Beacon from binds/wins; restore 6 structures
      (Hearth/Aether Font/Whetstone/Archive/Knell-Shrine/Aviary) for economy/PvE perks; the world
      visibly "lifts" as the Hearth tier rises (the soul + retention loop from PROGRESSION.md)
- [x] **The Warding Skill Tree** — spend Insight across 4 branches / 16 nodes (rising cost; ≈650 to
      complete = a long grind); economy/utility/access perks only, never timing. Open with K
- [x] **World event: Knell Stutter** — rare spawns surge periodically (the hunt loop)
- [x] **Trials & Daily Ward** — endless flick gauntlet (T) + a date-seeded Daily (Y), with persisted
      local best scores ("leaderboard"); score = Perfects landed
- [x] **Story & the Hunt** — narrative beats (intro, first bind) + an escalating Hollow-Shrine boss
      ladder (Pyreon → Brinewraith → Mourne) with intro/victory beats; the Knell steadies at the end
- [ ] Story/Hunt across all six domains (needs the other 5 domain maps/art)
- [ ] Per-element Affinity sub-trees & per-Wraith Pacts (extend the grind)
- [ ] Swap programmer-art for real pixel-art tiles/sprites (needs assets — see ART_BIBLE.md §0)
- [ ] Conditional/world-event spawns (RARITY.md §4)
- [ ] A fuller Story/Hunt across the six domains

**Gate:** a player will catch, build a team, and finish the intro Hunt — and want more.

## Phase 3 — Retention & Skill Content  🟢 STARTED
- [x] Trials (endless skill gauntlet) + local best scores
- [x] Daily Ward (date-seeded daily gauntlet)
- [x] Practice/metronome trainer (slow 800ms Knell, harmless enemy — P key)
- [x] Game-feel pass: particles, screenshake, flashes, hit audio (cosmetic only)
- [x] Touch/mobile-web controls (tap-to-flick, hold-to-walk, tap menus)
- [x] Mute toggle (M); colorblind-safe glyphs were in from day one
- [ ] Replays + one-click clip export (viral loop)
- [ ] Online leaderboards (needs backend — Phase 4)
- [ ] Fuller accessibility pass (cue options, remapping)

**Gate:** D1/D7 retention signal good enough to invest in backend + monetization.

## Phase 4 — Accounts, Cosmetics, Live
- [ ] Lightweight backend (accounts, save, leaderboards, cosmetics inventory)
- [ ] Cosmetic system (Ward FX, skins, identity) + premium currency
- [ ] First Battle Pass ("Warden's Pact" season 1)
- [ ] Rewarded ads (opt-in) + portal SDK integration

**Gate:** cosmetics convert without hurting retention; unit economics make sense.

## Phase 5 — PvP & Launch
- [ ] PvP netcode (prototype lockstep vs rollback; pick on feel/fairness)
- [ ] Ranked Duels + ladder
- [ ] Publish to web portals (Poki/CrazyGames) + own domain
- [ ] Creator/streamer push (spectator mode, clip tools)

**Gate:** public launch.

## Phase 6 — Beyond
- Hollow (7th element) + dual-typing meta, seasonal Wraiths, Steam/mobile builds, esport/tournament
  tooling.

---

### Principles
- **Fun-first, vertical slices.** Always have something playable.
- **Skill is sacred.** No mechanic or purchase undermines timing being what wins.
- **Data-driven.** Wraiths/balance live in data files so we tune without code changes.
- **Test the core.** The pure-TS combat sim gets unit tests; timing/flick logic is too important to
  leave unverified.
- **Original everything.** Art, audio, names, code — all ours.
