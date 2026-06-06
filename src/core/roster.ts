import type { Element } from './types';

/** One bound species in the player's collection. */
export interface BoundEntry {
  name: string;
  element: Element;
  count: number; // how many of this species the Warden has bound
}

/** Serializable snapshot for save/load. */
export interface RosterState {
  collection: Record<string, BoundEntry>;
  partyOrder: string[];
  activeIndex: number;
}

/**
 * The Warden's collection + active party. Pure data — no DOM (persistence lives in game/save.ts).
 * Binding a new species adds it to the party order; re-binding increments its count.
 */
export class Roster {
  private collection = new Map<string, BoundEntry>();
  partyOrder: string[] = [];
  activeIndex = 0;

  constructor(state?: RosterState) {
    if (state) {
      for (const [k, v] of Object.entries(state.collection)) this.collection.set(k, { ...v });
      this.partyOrder = [...state.partyOrder];
      this.activeIndex = state.activeIndex;
    }
  }

  /** Bind a Wraith. Returns true if it's a brand-new species for the collection. */
  add(name: string, element: Element): boolean {
    const existing = this.collection.get(name);
    if (existing) {
      existing.count++;
      return false;
    }
    this.collection.set(name, { name, element, count: 1 });
    this.partyOrder.push(name);
    return true;
  }

  has(name: string): boolean {
    return this.collection.has(name);
  }

  isEmpty(): boolean {
    return this.partyOrder.length === 0;
  }

  /** The currently-selected Wraith to battle with. */
  active(): BoundEntry {
    const name = this.partyOrder[this.activeIndex];
    const e = name ? this.collection.get(name) : undefined;
    if (!e) throw new Error('Roster is empty — no active Wraith');
    return e;
  }

  /** Cycle the active Wraith to the next in the party. */
  cycle(): void {
    if (this.partyOrder.length > 0) this.activeIndex = (this.activeIndex + 1) % this.partyOrder.length;
  }

  /** Number of distinct species bound. */
  speciesCount(): number {
    return this.partyOrder.length;
  }

  /** Total Wraiths bound (including duplicates). */
  totalBound(): number {
    let n = 0;
    for (const e of this.collection.values()) n += e.count;
    return n;
  }

  entries(): BoundEntry[] {
    return this.partyOrder.map((n) => this.collection.get(n)!);
  }

  toJSON(): RosterState {
    const collection: Record<string, BoundEntry> = {};
    for (const [k, v] of this.collection) collection[k] = { ...v };
    return { collection, partyOrder: [...this.partyOrder], activeIndex: this.activeIndex };
  }

  static from(state: RosterState): Roster {
    return new Roster(state);
  }
}
