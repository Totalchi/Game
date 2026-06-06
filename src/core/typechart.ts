import type { Element } from './types';

/** Original element wheel from docs/GAME_DESIGN.md §5.1. `BEATS[a]` = elements `a` is strong against. */
export const BEATS: Record<Element, Element[]> = {
  ember: ['bloom', 'frost'],
  tide: ['ember', 'stone'],
  storm: ['tide', 'bloom'],
  stone: ['ember', 'storm'],
  bloom: ['tide', 'stone'],
  frost: ['storm', 'bloom'],
  hollow: [], // Hollow is type-null: neutral to everything (it breaks the chart on purpose).
};

export type Matchup = 'advantage' | 'disadvantage' | 'neutral';

export function matchup(attacker: Element, defender: Element): Matchup {
  if (attacker === 'hollow' || defender === 'hollow') return 'neutral';
  if (BEATS[attacker].includes(defender)) return 'advantage';
  if (BEATS[defender].includes(attacker)) return 'disadvantage';
  return 'neutral';
}

/** Incoming-damage multiplier when an attack of `attacker` lands on a `defender`-type Wraith. */
export function damageMultiplier(attacker: Element, defender: Element): number {
  switch (matchup(attacker, defender)) {
    case 'advantage':
      return 1.25;
    case 'disadvantage':
      return 0.8;
    default:
      return 1;
  }
}
