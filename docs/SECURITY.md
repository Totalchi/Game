# WARDBOUND — Security Model

WARDBOUND is currently a **100% client-side** game (TypeScript + Canvas, no backend). The threat
surface is therefore small, but we treat it seriously so the move to a backend (accounts, online
leaderboards, cosmetics) in Phase 4 starts from a safe base.

## Current posture (client-only)

- **No `eval`, no `Function()`, no `innerHTML`.** The UI is drawn on a `<canvas>`; we never inject
  HTML from data, so there is no DOM-based XSS surface. (Enforced by review; grep stays clean.)
- **The save file is untrusted input.** `localStorage` can be edited by the user, a shared machine,
  a browser extension, or (in a future XSS) an attacker. `loadGame()` therefore **sanitizes and
  clamps every field** before use (`src/game/save.ts`):
  - numbers are coerced to finite integers and clamped to sane ranges (no `NaN`/`Infinity`/negatives),
  - unknown `speciesId`s are dropped (prevents a crash in `statsOf`/version drift),
  - `activeIndex` is clamped into party range, arrays/objects are type-checked,
  - any parse/shape error falls back to a fresh game rather than crashing.
  Covered by `tests/save.test.ts`.
- **No secrets in the client.** There are no API keys, tokens, or credentials in the repo or bundle.
- **No network calls** at runtime (the game runs fully offline once loaded).
- **Deterministic, bounded simulation.** The combat core is pure and cannot be driven into unbounded
  loops or allocation by save data (telegraph/particle counts are capped).

## When we add a backend (Phase 4) — the plan

- **Server-authoritative scores & state.** Trials/Daily/ranked results must be validated server-side;
  the client save is advisory only. Never trust client-reported scores for global leaderboards.
- **Replay validation.** Because the sim is deterministic, leaderboard runs are submitted as
  `(seed + input log)` and **re-simulated on the server** — the anti-cheat backbone (see NETCODE.md).
- **Auth:** standard OAuth / signed sessions; secrets server-side only; HTTPS everywhere.
- **Input validation & rate limiting** on every endpoint; parameterized queries; least-privilege DB.
- **Payments** (cosmetics) go through a vetted processor (Stripe) — we never handle raw card data.
- **CSP** headers (`script-src 'self'`) once served, to harden against injection.

## Reporting

Pre-release, file issues on the repo. Post-launch we'll publish a security contact and disclosure policy.
