import { Combat } from './combat';
import type { Element } from './types';

const SEQ_OTHERS: Element[] = ['ember', 'tide', 'storm', 'stone', 'bloom', 'frost'];

export interface BindingOptions {
  element: Element; // the wild Wraith's element
  seed?: number;
  count?: number; // number of strikes in the rite (rarer = more)
  threshold?: number; // Bind meter needed to catch (rarer = higher)
  startBonus?: number; // starting Bind meter bonus (Practised Bind skill)
}

/**
 * The Binding Rite — catching is a SKILL, not a dice roll (see docs/RARITY.md §3).
 * A weakened wild Wraith lashes out with a short, tight, escalating sequence; each well-Warded
 * strike fills the Bind meter, each Miss drains it. Fill past the threshold to bind it.
 *
 * Reuses the tested Combat grading engine (autoDirector off, no offense, player can't die).
 */
export class BindingRite {
  readonly combat: Combat;
  readonly total: number;
  readonly threshold: number;

  bindMeter: number;
  finished = false;
  bound = false;

  private seen = new Set<number>();

  constructor(now: number, opts: BindingOptions) {
    this.combat = new Combat(now, { playerElement: opts.element, autoDirector: false, seed: opts.seed });
    this.combat.playerVigor = 1e9; // you cannot die during a Rite
    this.combat.enemyVigor = 1e9; // ...and Perfect-counters can't end it either (the Rite ends by meter)
    this.total = opts.count ?? 5;
    this.threshold = opts.threshold ?? 65;
    this.bindMeter = Math.min(100, 20 + (opts.startBonus ?? 0)); // 20 goodwill + Practised Bind

    const startTick = 3;
    const spacing = 2; // tight cadence
    for (let i = 0; i < this.total; i++) {
      this.combat.addTelegraph({ element: this.seqElement(opts.element, i), landingTick: startTick + i * spacing, power: 0 });
    }
  }

  private seqElement(base: Element, i: number): Element {
    // Deterministic mix: mostly the wild's element, with off-element tests interleaved.
    if (i % 2 === 0) return base;
    const others = SEQ_OTHERS.filter((e) => e !== base);
    return others[(i * 7) % others.length];
  }

  // ---- input (delegate to the inner combat) ----
  raiseWard(element: Element, now: number): void {
    this.combat.raiseWard(element, now);
  }
  releaseWard(element: Element, now: number): void {
    this.combat.releaseWard(element, now);
  }
  dropWard(now: number): void {
    this.combat.dropWard(now);
  }

  // ---- step ----
  update(now: number): void {
    if (this.finished) return;
    this.combat.update(now);

    for (const t of this.combat.telegraphs) {
      if (t.resolved && t.grade && !this.seen.has(t.id)) {
        this.seen.add(t.id);
        const delta = t.grade === 'perfect' ? 25 : t.grade === 'clean' ? 12 : t.grade === 'graze' ? 4 : -15;
        this.bindMeter = Math.max(0, Math.min(100, this.bindMeter + delta));
      }
    }

    if (this.seen.size >= this.total) {
      this.finished = true;
      this.bound = this.bindMeter >= this.threshold;
    }
  }

  /** How many strikes have resolved so far (for UI). */
  progressCount(): number {
    return this.seen.size;
  }
}
