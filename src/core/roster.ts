import type { Mon } from './mon';
import { statsOf } from './mon';
import type { Element } from './types';

const PARTY_CAP = 6;

/** Per-species collection record. */
export interface DexEntry {
  speciesId: string;
  bound: number; // total bound of this species
  aberrant: boolean; // has the Warden bound an Aberrant of it?
}

export interface RosterState {
  party: Mon[];
  dex: Record<string, DexEntry>;
  activeIndex: number;
}

/**
 * The Warden's party (up to 6 active Mons) + a dex of everything bound. Pure data;
 * persistence lives in game/save.ts. See docs/PROGRESSION.md.
 */
export class Roster {
  party: Mon[] = [];
  activeIndex = 0;
  private dex = new Map<string, DexEntry>();

  constructor(state?: RosterState) {
    if (state) {
      this.party = state.party.map((m) => ({ ...m }));
      this.activeIndex = state.activeIndex;
      for (const [k, v] of Object.entries(state.dex)) this.dex.set(k, { ...v });
    }
  }

  isEmpty(): boolean {
    return this.party.length === 0;
  }

  active(): Mon {
    const m = this.party[this.activeIndex];
    if (!m) throw new Error('Roster is empty — no active Wraith');
    return m;
  }

  cycle(): void {
    if (this.party.length > 0) this.activeIndex = (this.activeIndex + 1) % this.party.length;
  }

  /** Bind a Mon: record it in the dex and add to the party if there's room. Returns true if new species. */
  addCatch(mon: Mon): boolean {
    const entry = this.dex.get(mon.speciesId);
    const isNew = !entry;
    if (entry) {
      entry.bound++;
      entry.aberrant = entry.aberrant || mon.aberrant;
    } else {
      this.dex.set(mon.speciesId, { speciesId: mon.speciesId, bound: 1, aberrant: mon.aberrant });
    }
    if (this.party.length < PARTY_CAP) this.party.push(mon);
    return isNew;
  }

  partyFull(): boolean {
    return this.party.length >= PARTY_CAP;
  }

  speciesCount(): number {
    return this.dex.size;
  }

  totalBound(): number {
    let n = 0;
    for (const e of this.dex.values()) n += e.bound;
    return n;
  }

  /** Party display labels (name + current species element via stats). */
  partyLabels(): { name: string; element: Element; active: boolean }[] {
    return this.party.map((m, i) => {
      const s = statsOf(m);
      return { name: s.name, element: s.element, active: i === this.activeIndex };
    });
  }

  toJSON(): RosterState {
    const dex: Record<string, DexEntry> = {};
    for (const [k, v] of this.dex) dex[k] = { ...v };
    return { party: this.party.map((m) => ({ ...m })), dex, activeIndex: this.activeIndex };
  }

  static from(state: RosterState): Roster {
    return new Roster(state);
  }
}
