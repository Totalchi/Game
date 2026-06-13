/**
 * The Warding Skill Tree — long-haul meta-progression (docs/PROGRESSION.md §3).
 * Spend Insight (earned slowly from play) across four branches. Every node grants
 * economy / utility / access — NEVER timing (skill purity). Completing it all is a long grind.
 * Pure data; persistence in game/save.ts.
 */

export type Branch = 'conservation' | 'resolve' | 'hunter' | 'warding';

export type EffectKind =
  | 'aetherRegen' // +mult to Aether regen
  | 'maxAether' // +flat max Aether
  | 'drainDown' // -mult to Aether drain while Warding
  | 'bonusResolve' // +flat Resolve per Perfect
  | 'strikePower' // +mult Strike damage
  | 'resolveCap' // +flat Resolve cap
  | 'momentumDown' // -mult to enemy Momentum damage
  | 'curseDur' // -mult to curse duration on you
  | 'xp' // +mult XP
  | 'beacon' // +mult Beacon income
  | 'rareLuck' // +flat rare-spawn luck
  | 'bindStart' // +flat starting Bind meter
  | 'swapCost'; // -mult mid-battle swap cost

export interface SkillNode {
  id: string;
  name: string;
  branch: Branch;
  desc: string;
  maxRank: number;
  baseCost: number; // cost to buy rank r = baseCost * (r + 1)
  effect: { kind: EffectKind; perRank: number };
  requires?: { id: string; rank: number };
}

export const BRANCH_COLOR: Record<Branch, string> = {
  conservation: '#48c0ff',
  resolve: '#ff7ad9',
  hunter: '#ffd54a',
  warding: '#9fe8ff',
};

export const SKILL_NODES: SkillNode[] = [
  // --- Conservation (Aether economy) ---
  { id: 'cons_regen', name: 'Steady Breath', branch: 'conservation', desc: '+8% Aether regen / rank', maxRank: 5, baseCost: 3, effect: { kind: 'aetherRegen', perRank: 0.08 } },
  { id: 'cons_well', name: 'Deep Well', branch: 'conservation', desc: '+5 max Aether / rank', maxRank: 5, baseCost: 3, effect: { kind: 'maxAether', perRank: 5 }, requires: { id: 'cons_regen', rank: 2 } },
  { id: 'cons_step', name: 'Light Step', branch: 'conservation', desc: '-12% swap cost / rank', maxRank: 3, baseCost: 4, effect: { kind: 'swapCost', perRank: 0.12 }, requires: { id: 'cons_regen', rank: 1 } },
  { id: 'cons_surge', name: 'Aether Surge', branch: 'conservation', desc: '+5 max Aether / rank', maxRank: 5, baseCost: 5, effect: { kind: 'maxAether', perRank: 5 }, requires: { id: 'cons_well', rank: 3 } },
  { id: 'cons_cap', name: 'Eternal Flame', branch: 'conservation', desc: 'Wards drain 15% less Aether', maxRank: 1, baseCost: 22, effect: { kind: 'drainDown', perRank: 0.15 }, requires: { id: 'cons_well', rank: 3 } },

  // --- Resolve (offense) ---
  { id: 'res_riposte', name: 'Riposte', branch: 'resolve', desc: '+2 Resolve on Perfect / rank', maxRank: 5, baseCost: 3, effect: { kind: 'bonusResolve', perRank: 2 } },
  { id: 'res_edge', name: 'Honed Edge', branch: 'resolve', desc: '+4% Strike power / rank', maxRank: 5, baseCost: 4, effect: { kind: 'strikePower', perRank: 0.04 }, requires: { id: 'res_riposte', rank: 2 } },
  { id: 'res_reserve', name: 'Deep Reserve', branch: 'resolve', desc: '+10 Resolve cap / rank', maxRank: 3, baseCost: 5, effect: { kind: 'resolveCap', perRank: 10 }, requires: { id: 'res_riposte', rank: 1 } },
  { id: 'res_finisher', name: 'Finisher', branch: 'resolve', desc: '+5% Strike power / rank', maxRank: 3, baseCost: 6, effect: { kind: 'strikePower', perRank: 0.05 }, requires: { id: 'res_edge', rank: 3 } },
  { id: 'res_cap', name: 'Overflow', branch: 'resolve', desc: '+15% Strike power', maxRank: 1, baseCost: 22, effect: { kind: 'strikePower', perRank: 0.15 }, requires: { id: 'res_edge', rank: 3 } },

  // --- Hunter (access / income) ---
  { id: 'hun_eye', name: 'Keen Eye', branch: 'hunter', desc: '+rare-spawn luck / rank', maxRank: 5, baseCost: 3, effect: { kind: 'rareLuck', perRank: 1 } },
  { id: 'hun_tithe', name: "Warden's Tithe", branch: 'hunter', desc: '+8% Beacon income / rank', maxRank: 5, baseCost: 4, effect: { kind: 'beacon', perRank: 0.08 }, requires: { id: 'hun_eye', rank: 1 } },
  { id: 'hun_scholar', name: 'Scholar', branch: 'hunter', desc: '+8% XP / rank', maxRank: 5, baseCost: 4, effect: { kind: 'xp', perRank: 0.08 }, requires: { id: 'hun_eye', rank: 1 } },
  { id: 'hun_bind', name: 'Practised Bind', branch: 'hunter', desc: '+6 starting Bind meter / rank', maxRank: 5, baseCost: 4, effect: { kind: 'bindStart', perRank: 6 }, requires: { id: 'hun_eye', rank: 2 } },
  { id: 'hun_seer', name: 'Seer', branch: 'hunter', desc: '+1 rare-spawn luck / rank', maxRank: 3, baseCost: 6, effect: { kind: 'rareLuck', perRank: 1 }, requires: { id: 'hun_eye', rank: 3 } },
  { id: 'hun_harvest', name: 'Rich Veins', branch: 'hunter', desc: '+10% Beacon / rank', maxRank: 3, baseCost: 6, effect: { kind: 'beacon', perRank: 0.1 }, requires: { id: 'hun_tithe', rank: 3 } },
  { id: 'hun_cap', name: "Fortune's Favour", branch: 'hunter', desc: '+6 rare-spawn luck', maxRank: 1, baseCost: 24, effect: { kind: 'rareLuck', perRank: 6 }, requires: { id: 'hun_eye', rank: 5 } },

  // --- Warding (defensive utility) ---
  { id: 'ward_calm', name: 'Calm Mind', branch: 'warding', desc: '-8% curse duration / rank', maxRank: 5, baseCost: 4, effect: { kind: 'curseDur', perRank: 0.08 } },
  { id: 'ward_break', name: 'Momentum Break', branch: 'warding', desc: '-12% Momentum damage / rank', maxRank: 3, baseCost: 5, effect: { kind: 'momentumDown', perRank: 0.12 }, requires: { id: 'ward_calm', rank: 1 } },
  { id: 'ward_steadfast', name: 'Steadfast', branch: 'warding', desc: '-8% Momentum damage / rank', maxRank: 3, baseCost: 6, effect: { kind: 'momentumDown', perRank: 0.08 }, requires: { id: 'ward_break', rank: 2 } },
  { id: 'ward_cap', name: 'Unbroken', branch: 'warding', desc: '-20% curse duration', maxRank: 1, baseCost: 22, effect: { kind: 'curseDur', perRank: 0.2 }, requires: { id: 'ward_calm', rank: 5 } },
];

const BY_ID = new Map(SKILL_NODES.map((n) => [n.id, n]));

export interface SkillTreeState {
  insight: number;
  ranks: Record<string, number>;
}

export class SkillTree {
  insight = 0;
  private ranks = new Map<string, number>();

  constructor(state?: SkillTreeState) {
    if (state) {
      this.insight = state.insight;
      for (const [k, v] of Object.entries(state.ranks)) this.ranks.set(k, v);
    }
  }

  rankOf(id: string): number {
    return this.ranks.get(id) ?? 0;
  }

  isMaxed(id: string): boolean {
    const n = BY_ID.get(id);
    return !!n && this.rankOf(id) >= n.maxRank;
  }

  prereqMet(id: string): boolean {
    const n = BY_ID.get(id);
    if (!n || !n.requires) return true;
    return this.rankOf(n.requires.id) >= n.requires.rank;
  }

  costOf(id: string): number {
    const n = BY_ID.get(id);
    if (!n) return Infinity;
    return n.baseCost * (this.rankOf(id) + 1);
  }

  canBuy(id: string): boolean {
    return !this.isMaxed(id) && this.prereqMet(id) && this.insight >= this.costOf(id);
  }

  buy(id: string): boolean {
    if (!this.canBuy(id)) return false;
    this.insight -= this.costOf(id);
    this.ranks.set(id, this.rankOf(id) + 1);
    return true;
  }

  addInsight(n: number): void {
    this.insight += Math.max(0, Math.round(n));
  }

  spent(): number {
    let total = 0;
    for (const [id, r] of this.ranks) {
      const n = BY_ID.get(id);
      if (!n) continue;
      for (let i = 0; i < r; i++) total += n.baseCost * (i + 1);
    }
    return total;
  }

  /** Total Insight required to fully complete the tree (the long-grind target). */
  static totalToComplete(): number {
    let total = 0;
    for (const n of SKILL_NODES) for (let i = 0; i < n.maxRank; i++) total += n.baseCost * (i + 1);
    return total;
  }

  private sum(kind: EffectKind): number {
    let s = 0;
    for (const [id, r] of this.ranks) {
      const n = BY_ID.get(id);
      if (n && n.effect.kind === kind) s += r * n.effect.perRank;
    }
    return s;
  }

  // ---- aggregated perks ----
  aetherRegenMult(): number {
    return 1 + this.sum('aetherRegen');
  }
  maxAetherBonus(): number {
    return this.sum('maxAether');
  }
  drainMult(): number {
    return Math.max(0.5, 1 - this.sum('drainDown'));
  }
  bonusResolve(): number {
    return this.sum('bonusResolve');
  }
  strikePowerMult(): number {
    return 1 + this.sum('strikePower');
  }
  resolveCapBonus(): number {
    return this.sum('resolveCap');
  }
  momentumMult(): number {
    return Math.max(0, 1 - this.sum('momentumDown'));
  }
  curseDurMult(): number {
    return Math.max(0.2, 1 - this.sum('curseDur'));
  }
  xpMult(): number {
    return 1 + this.sum('xp');
  }
  beaconMult(): number {
    return 1 + this.sum('beacon');
  }
  rareLuck(): number {
    return this.sum('rareLuck');
  }
  bindStart(): number {
    return this.sum('bindStart');
  }
  swapCostMult(): number {
    return Math.max(0, 1 - this.sum('swapCost'));
  }

  toJSON(): SkillTreeState {
    const ranks: Record<string, number> = {};
    for (const [k, v] of this.ranks) ranks[k] = v;
    return { insight: this.insight, ranks };
  }

  static from(state: SkillTreeState): SkillTree {
    return new SkillTree(state);
  }
}
