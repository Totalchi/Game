import { CINDERWASTE_SPAWNS, ABERRANT_RATE, SPECIES } from '../data/species';
import { makeMon, type Mon } from './mon';
import { makeRng } from './rng';

/**
 * Roll a wild Wraith for the Cinderwaste. `luck` (from skills/Sanctuary/Knell Stutters)
 * boosts the weight of rarer species and slightly improves Aberrant odds.
 */
export function rollWild(seed: number, luck = 0): Mon {
  const rng = makeRng(seed);
  const weighted = CINDERWASTE_SPAWNS.map(([id, w]) => {
    const r = SPECIES[id].rarity;
    const mult = r === 'common' ? 1 : r === 'uncommon' ? 1 + luck * 0.05 : 1 + luck * 0.16; // rarer gains more
    return [id, w * mult] as [string, number];
  });
  const total = weighted.reduce((a, [, w]) => a + w, 0);
  let roll = rng() * total;
  let chosen = weighted[0][0];
  for (const [id, w] of weighted) {
    if (roll < w) {
      chosen = id;
      break;
    }
    roll -= w;
  }
  const level = 3 + Math.floor(rng() * 6); // 3..8
  const aberrant = Math.floor(rng() * Math.max(6, ABERRANT_RATE - luck)) === 0;
  return makeMon(chosen, level, aberrant);
}
