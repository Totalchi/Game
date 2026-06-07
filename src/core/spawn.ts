import { CINDERWASTE_SPAWNS, ABERRANT_RATE } from '../data/species';
import { makeMon, type Mon } from './mon';
import { makeRng } from './rng';

/** Roll a wild Wraith for the Cinderwaste: weighted species, a level, and a rare Aberrant chance. */
export function rollWild(seed: number): Mon {
  const rng = makeRng(seed);
  const total = CINDERWASTE_SPAWNS.reduce((a, [, w]) => a + w, 0);
  let r = rng() * total;
  let chosen = CINDERWASTE_SPAWNS[0][0];
  for (const [id, w] of CINDERWASTE_SPAWNS) {
    if (r < w) {
      chosen = id;
      break;
    }
    r -= w;
  }
  const level = 3 + Math.floor(rng() * 6); // 3..8
  const aberrant = Math.floor(rng() * ABERRANT_RATE) === 0;
  return makeMon(chosen, level, aberrant);
}
