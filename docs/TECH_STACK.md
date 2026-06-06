# WARDBOUND — Tech Stack & Architecture Decision

> Decision driven by research (June 2026). Goal: maximize reach + monetizability while giving us
> the **tick-perfect timing precision** the flick mechanic demands.

## TL;DR

| Layer | Choice | Why |
| --- | --- | --- |
| **Platform** | Web (HTML5), mobile-web friendly | Zero install = best reach + discovery + lowest friction. Native (Steam/mobile) later. |
| **Engine** | **Phaser 3** | Best-in-class for *monetizable 2D web games*: small/fast builds, mature, commercially proven, integrates with web game portals. |
| **Language** | **TypeScript** | Type safety matters for a systems-heavy game (combat, type chart, netcode). |
| **Build** | **Vite** | Fast HMR, tiny modern bundles, great DX. |
| **Game loop** | Custom **fixed-timestep tick scheduler** (600ms ticks) decoupled from render | Determinism + precise timing is non-negotiable for a flick game. |
| **State** | Plain TS modules + an event bus (no heavy framework in the hot path) | Keep the combat core dependency-light and testable. |
| **Backend (later)** | Lightweight Node service for accounts, leaderboards, cosmetics, PvP matchmaking | Defer until after the single-player slice proves fun. |

## Why Web first

- **Reach & discovery.** Web game portals are huge: Poki alone hit ~100M monthly players / ~1B
  plays per month in 2025. That's a discovery firehose no indie can buy.
- **Frictionless.** A skill game lives on "try it instantly." No store, no download, no account
  wall on first play.
- **Monetizable today.** Portals pay ad revshare; our own site adds cosmetic IAP. (See MONETIZATION.md.)
- **Streamable & shareable.** A URL is the cheapest viral loop.
- We can still ship to **Steam** (via a web wrapper or native build) and **mobile** later from the
  same TypeScript codebase.

## Why Phaser 3 (vs alternatives)

- **Phaser 3** — full 2D engine (WebGL renderer, input, audio, scenes, tweens, particles), small
  builds that load fast, battle-tested commercially, the de-facto standard for portal games. Best
  fit for our 2D, fast-loading, monetizable target. ✅ **Chosen.**
- **PixiJS** — excellent renderer but *just* a renderer; we'd hand-build engine systems. More work,
  little benefit for us.
- **Unity WebGL** — powerful but ~8MB+ minimum builds and slow web load times; wrong tradeoff for a
  snackable web title.
- **Defold / PlayCanvas** — solid, but Phaser's JS/TS ecosystem and portal track record win for us.

> Note: Phaser is the rendering/engine layer. The **combat tick core is engine-agnostic, pure TS**
> (no Phaser dependency) so it's unit-testable and portable to a native client later.

## Timing architecture (the part that actually matters)

A flick game is only as good as its timing fidelity. Plan:

1. **Fixed-timestep simulation.** The combat sim advances in discrete **600ms ticks** using an
   accumulator pattern driven by `performance.now()` — never tied to render framerate.
2. **Input timestamping.** Player inputs are timestamped on the event and resolved against the tick
   they fall in, so a flick is judged by *when it happened*, not when the frame rendered.
3. **Render interpolation.** Visuals smoothly interpolate between tick states for a fluid look at
   any FPS, while logic stays locked to ticks.
4. **Latency budgeting.** We instrument input→resolve latency from day one and keep it tight; audio
   cue scheduling uses the Web Audio clock (sample-accurate), not `setTimeout`.
5. **Determinism.** The sim is deterministic given inputs + seed — essential for replays,
   leaderboards integrity, and (later) PvP.

## PvP netcode (flagged, decide later)

Timing-game PvP is hard; fairness is everything. Two candidate models, to prototype in the PvP
phase (see ROADMAP):

- **Server-authoritative tick lockstep** with input delay — simpler to keep fair, adds latency.
- **Rollback-style** — best feel, more complex.

We deliberately defer this; the single-player + async leaderboard content carries us a long way and
de-risks the fun before we invest in netcode.

## Proposed repo structure (when we start building)

```
/                 # project root
  index.html
  package.json
  vite.config.ts
  /src
    /core         # ENGINE-AGNOSTIC pure TS: tick scheduler, combat sim, type chart, ward logic
    /game         # Phaser scenes, sprites, input, UI, audio
    /data         # wraith definitions, type chart, balance tables (data-driven)
    /assets       # original art, audio (placeholder art first)
  /tests          # unit tests for /core (combat, type chart, flick judging)
  /docs           # this documentation
```

## First build target

A **playable single-battle prototype**: one Wraith vs one telegraphing enemy, the full flick loop
(tick clock, telegraphs, Wards, energy, hit/negate, Resolve), placeholder art. Prove the fun, then
expand. (See ROADMAP Phase 1.)
