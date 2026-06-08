/**
 * The Sanctuary — base building & meta-progression (docs/PROGRESSION.md §1).
 * Earn Beacon from binds/wins, rebuild structures. Perks are economy/PvE only — never timing
 * (skill purity). Pure data; persistence lives in game/save.ts.
 */

export interface StructureDef {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;
  baseCost: number;
  costMult: number;
}

export const STRUCTURES: StructureDef[] = [
  { id: 'hearth', name: 'The Hearth', desc: 'The heart of the Sanctuary. Each tier lifts the Long Dusk.', maxLevel: 5, baseCost: 15, costMult: 1.8 },
  { id: 'aetherfont', name: 'Aether Font', desc: '+6 max Aether per level (in battle).', maxLevel: 5, baseCost: 10, costMult: 1.6 },
  { id: 'whetstone', name: 'Whetstone', desc: '+6% Strike power per level.', maxLevel: 5, baseCost: 12, costMult: 1.6 },
  { id: 'archive', name: 'The Archive', desc: '+12% XP from battles per level.', maxLevel: 5, baseCost: 10, costMult: 1.55 },
  { id: 'knellshrine', name: 'Knell-Shrine', desc: '+15% Beacon income per level.', maxLevel: 5, baseCost: 10, costMult: 1.6 },
];

const BY_ID = new Map(STRUCTURES.map((s) => [s.id, s]));

export interface SanctuaryState {
  beacon: number;
  levels: Record<string, number>;
}

export class Sanctuary {
  beacon = 0;
  private levels = new Map<string, number>();

  constructor(state?: SanctuaryState) {
    if (state) {
      this.beacon = state.beacon;
      for (const [k, v] of Object.entries(state.levels)) this.levels.set(k, v);
    }
  }

  levelOf(id: string): number {
    return this.levels.get(id) ?? 0;
  }

  isMaxed(id: string): boolean {
    const def = BY_ID.get(id);
    return !!def && this.levelOf(id) >= def.maxLevel;
  }

  /** Beacon cost to raise a structure to its next level. */
  costOf(id: string): number {
    const def = BY_ID.get(id);
    if (!def) return Infinity;
    return Math.round(def.baseCost * Math.pow(def.costMult, this.levelOf(id)));
  }

  canAfford(id: string): boolean {
    return !this.isMaxed(id) && this.beacon >= this.costOf(id);
  }

  /** Spend Beacon to upgrade; returns true on success. */
  upgrade(id: string): boolean {
    if (!this.canAfford(id)) return false;
    this.beacon -= this.costOf(id);
    this.levels.set(id, this.levelOf(id) + 1);
    return true;
  }

  addBeacon(amount: number): void {
    this.beacon += Math.max(0, Math.round(amount));
  }

  // ---- perks ----
  bonusAether(): number {
    return this.levelOf('aetherfont') * 6;
  }
  powerMult(): number {
    return 1 + this.levelOf('whetstone') * 0.06;
  }
  xpMult(): number {
    return 1 + this.levelOf('archive') * 0.12;
  }
  beaconMult(): number {
    return 1 + this.levelOf('knellshrine') * 0.15;
  }
  /** Sanctuary tier = Hearth level; drives the world-healing flavour. */
  tier(): number {
    return this.levelOf('hearth');
  }

  toJSON(): SanctuaryState {
    const levels: Record<string, number> = {};
    for (const [k, v] of this.levels) levels[k] = v;
    return { beacon: this.beacon, levels };
  }

  static from(state: SanctuaryState): Sanctuary {
    return new Sanctuary(state);
  }
}

/** Flavour shown as the Hearth tier rises — Vael visibly healing. */
export const TIER_FLAVOUR = [
  'The dusk is total. A cold, broken hall.',
  'A single lantern flickers back to life.',
  'Warmth returns to the hall; a survivor stays.',
  'Survivors gather; the hearth-song carries.',
  'The dusk-garden stirs and greens.',
  'Vael breathes again — held, not healed.',
];
