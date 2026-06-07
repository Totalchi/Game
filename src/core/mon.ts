import { SPECIES, SIGNATURES, type Signature, type Rarity } from '../data/species';
import type { Element } from './types';

/** An owned/encountered Wraith instance. */
export interface Mon {
  speciesId: string;
  level: number;
  xp: number;
  aberrant: boolean; // prestige "shiny" variant — cosmetic only
}

export interface MonStats {
  name: string;
  element: Element;
  rarity: Rarity;
  vigor: number;
  aether: number;
  power: number; // Strike damage
  signature?: Signature;
  aberrant: boolean;
  level: number;
}

export function makeMon(speciesId: string, level = 5, aberrant = false): Mon {
  return { speciesId, level: Math.max(1, level), xp: 0, aberrant };
}

/** XP needed to advance FROM the given level to the next. */
export function xpToNext(level: number): number {
  return 20 + level * 12;
}

/** Computed, level- and signature-adjusted stats for a Mon. */
export function statsOf(mon: Mon): MonStats {
  const s = SPECIES[mon.speciesId];
  const sig = s.signature ? SIGNATURES[s.signature] : undefined;
  const lv = mon.level - 1;
  let aether = s.base.aether + (sig?.aetherBonus ?? 0);
  return {
    name: s.name,
    element: s.element,
    rarity: s.rarity,
    vigor: Math.round(s.base.vigor + s.perLevel.vigor * lv),
    aether,
    power: Math.round(s.base.power + s.perLevel.power * lv),
    signature: sig,
    aberrant: mon.aberrant,
    level: mon.level,
  };
}

export interface LevelUpResult {
  leveledTo: number[]; // each new level reached
  ascended?: { fromName: string; toName: string };
}

/** Grant XP; handles multi-level-ups and Ascension. Mutates the Mon. */
export function gainXp(mon: Mon, amount: number): LevelUpResult {
  const res: LevelUpResult = { leveledTo: [] };
  mon.xp += Math.max(0, amount);
  while (mon.xp >= xpToNext(mon.level)) {
    mon.xp -= xpToNext(mon.level);
    mon.level++;
    res.leveledTo.push(mon.level);
    const s = SPECIES[mon.speciesId];
    if (s.ascendsTo && s.ascendLevel && mon.level >= s.ascendLevel) {
      const toName = SPECIES[s.ascendsTo].name;
      res.ascended = { fromName: s.name, toName };
      mon.speciesId = s.ascendsTo;
    }
  }
  return res;
}
