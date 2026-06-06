import type { Grade } from './types';

/**
 * Central tuning. Numbers are starting hypotheses from docs/COMBAT_DEEPDIVE.md §10 —
 * the prototype exists to make these *feel* right with real hands.
 */
export const TICK_MS = 600; // The Knell — the world's heartbeat.

export const CFG = {
  tickMs: TICK_MS,

  // Grading windows (ms relative to the landing instant). Universal & fixed (skill purity).
  perfectMs: 150, // raise the correct Ward within this of landing -> Perfect (a snap)
  grazeMs: 130, // correct Ward just-missed (dropped early / raised late) -> Graze

  // Aether (energy)
  aetherMax: 100,
  aetherDrainPerMs: 8 / TICK_MS, // ~8 per tick while a Ward is held
  aetherRegenPerMs: 5 / TICK_MS, // ~5 per tick while all Wards are down

  // Resolve (counter-meter)
  resolveMax: 100,
  resolveGain: { perfect: 25, clean: 10, graze: 3, miss: 0 } as Record<Grade, number>,

  // Offense
  strikeCost: 25,
  strikePower: 60,

  // Vigor (HP)
  playerVigor: 100,
  enemyVigor: 320,

  // Momentum: each enemy Momentum stack adds this fraction to incoming damage; a Perfect resets it.
  momentumDamagePerStack: 0.12,
} as const;
