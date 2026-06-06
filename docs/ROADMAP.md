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

## Phase 2 — The Collector Loop
- [ ] Full 6-element type chart wired into combat
- [ ] 8–12 Wraiths with distinct stats/Strikes/signatures (placeholder art)
- [ ] Binding (catch) minigame
- [ ] Team of 6, mid-battle swap, leveling, Ascension (evolution)
- [ ] Short Story/Hunt with escalating telegraphs + a boss

**Gate:** a player will catch, build a team, and finish the intro Hunt — and want more.

## Phase 3 — Retention & Skill Content
- [ ] Trials (endless skill gauntlet) + local leaderboards
- [ ] Daily Ward (seeded daily puzzle)
- [ ] Practice/metronome trainer
- [ ] Replays + one-click clip export (viral loop)
- [ ] Accessibility pass (colorblind palette, cue options, tick-speed in casual)

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
