# WARDBOUND — PvP & Netcode Strategy

> In a timing game, **fairness is the whole product.** If the netcode is unfair, the skill ceiling is
> a lie and the esport dies. This is our plan to make real-time flick duels provably fair — and our
> single biggest technical advantage in pulling it off.

## 1. Our secret weapon: a 600ms tick

Most action games fight latency because they resolve at 60Hz (~16ms windows) — a few hundred ms of ping
is catastrophic. **WARDBOUND resolves on a 600ms tick.** That is enormous headroom:

- Almost all real-world latency (even 150–250ms RTT) **fits comfortably inside a single tick.**
- We can run a **deterministic, server-authoritative, tick-locked** simulation where both players'
  inputs for tick *N* are collected, then resolved together — and it feels instant because the tick is
  long anyway.
- This lets us deliver **lockstep-level fairness with rollback-level feel**, without the brutal
  complexity rollback usually demands. The mechanic's defining trait (the slow heartbeat) is *also* what
  makes its netcode tractable. Rare and lucky.

## 2. The model (recommended)

**Server-authoritative deterministic tick lockstep with a small fixed input delay.**

1. The **server owns the simulation** and the clock (the authoritative Knell). Clients render and send
   timestamped inputs; they never decide outcomes.
2. **Fixed input delay** of ~1 tick: an input you make for the upcoming beat is guaranteed to arrive
   before the server resolves it (given normal ping). The delay is *constant and equal for both
   players*, so it's invisible and fair — no one is advantaged by lower ping for the *outcome* (only,
   slightly, for reaction comfort, which we further mitigate below).
3. **Deterministic sim** (already required for replays/ghosts) means the server's resolution is
   reproducible and verifiable → trivial **anti-cheat** (the server validates every flick's timing;
   clients can't fake a Perfect).
4. **Tolerant input window matching:** because we judge a flick by its *timestamp within the tick*, a
   late packet that still carries an in-window timestamp can be honored up to a cutoff — softening jitter.

## 3. Fairness & lag handling

- **Symmetric input delay** — both players play on the same delayed clock; fairness by construction.
- **Jitter buffer** sized to the player's connection; the long tick absorbs the rest.
- **Ping transparency** — both players see each other's ping and the agreed input delay; no hidden
  disadvantage.
- **High-latency handling:** if RTT approaches the tick budget, bump input delay by one more tick for
  *both* players (still symmetric, still fair — just a hair less snappy). Beyond a hard threshold,
  match isn't allowed (routed to better-matched opponents).
- **Disconnect/grief protection:** server-authoritative state means clean reconnect/resume; rage-quits
  auto-forfeit.

## 4. Matchmaking

- **Skill-based (MMR)** on the ranked ladder, with **latency-aware** pairing (prefer same-region within
  an MMR band; widen band before widening region).
- **Regional servers** (start with 2–3 regions; expand with the playerbase).
- **Normalized loadouts in ranked** (see PROGRESSION.md): standardized Wraith levels + capped build
  budget so the ladder measures *skill*, not grind or wallet.

## 5. Phased rollout (de-risk, ship value early)

1. **Phase A — Ghost Duels (async PvP, NO netcode).** Race a recorded, deterministic replay of another
   Warden. Delivers ~80% of the competitive *thrill* (beat their run, climb async ladders) with *zero*
   netcode risk. Ships early, carries us through launch. ← **do this first.**
2. **Phase B — Friendly real-time duels** (private lobbies) on the lockstep model — controlled testbed.
3. **Phase C — Ranked real-time ladder** with MMR, regions, anti-cheat hardening, spectator mode.
4. **Phase D — Tournaments/esport tooling** (brackets, observer cam, broadcast HUD).

## 6. Anti-cheat (a timing game must protect its integrity)

- **Server validates all timing** — the client cannot self-report a Perfect; the server recomputes it.
- **Determinism checks** — desync/tampered clients are detectable and droppable.
- **Input sanity** — superhuman/inhuman input patterns flagged (and replays make review easy).
- **No client-trusted state.** Ever. The ladder's credibility depends on it.

## 7. Risks & honest unknowns

- **Reaction-comfort vs. ping:** even with fair *outcomes*, a higher-ping player gets slightly less
  visual lead time. Mitigation: symmetric delay + clear telegraphs (long wind-ups) reduce reliance on
  raw reaction. Validate in playtests.
- **Region population** at launch: thin populations hurt matchmaking. Mitigation: Ghost Duels + cross-
  region unranked fill the gap until ranked has density.
- We will **prototype lockstep vs. rollback head-to-head** in Phase B before committing the ladder —
  measured on *feel and fairness with real pings*, not theory.
