/**
 * Story beats & the Hunt (boss ladder). See docs/STORY.md.
 * Beats are short narrative moments shown at milestones; the Hunt is the escalating
 * sequence of Primarch-Echo bosses at the Hollow Shrine, ending with Mourne.
 */

export interface Beat {
  title: string;
  text: string;
}

export const BEATS: Record<string, Beat> = {
  intro: {
    title: 'The Long Dusk',
    text:
      "The elements died in the Sundering; their echoes — Wraiths — roam a dimming world. " +
      "You are a late-born Warden who feels the Knell, the world's failing heartbeat, more clearly than anyone. " +
      'Flick in time with it. Bind the beasts. Hold the world together one beat longer.',
  },
  firstbind: {
    title: 'A Bond',
    text:
      'Your first Wraith yields — not broken, but bound. A fragment of a dead god, given a reason to exist again. ' +
      'Somewhere east, a shrine hums with the Hollow. The Hunt begins.',
  },
};

export interface HuntBoss {
  id: string;
  speciesId: string;
  level: number;
  name: string;
  intro: string;
  victory: string;
}

/** The boss ladder at the Hollow Shrine — escalating Primarch Echoes, then Mourne. */
export const HUNT_BOSSES: HuntBoss[] = [
  {
    id: 'echo_ember',
    speciesId: 'embereon',
    level: 18,
    name: 'Pyreon, the Ember Echo',
    intro: 'The Cinderwaste remembers the day its god burned. Pyreon, the Ember Echo, rises from the ash — ward its fury.',
    victory: 'Pyreon gutters out, almost grateful. One Primarch eased.',
  },
  {
    id: 'echo_tide',
    speciesId: 'brinewraith',
    level: 21,
    name: 'Brinewraith, the Tide Echo',
    intro: "Black water rises. The drowned god's echo, Brinewraith, reaches for you with a hundred cold hands.",
    victory: 'The tide stills. Brinewraith sinks into a quiet you gave it.',
  },
  {
    id: 'mourne',
    speciesId: 'voidmoth',
    level: 24,
    name: 'Voidmoth Mourne',
    intro:
      "At the Hollow's edge waits Mourne, the Hollowed — a Warden who would silence the Knell to end all suffering. " +
      'The heartbeat stutters as you face her.',
    victory: 'Mourne falls still, and the Knell steadies — held, not healed. Vael breathes. For now.',
  },
];

export interface StoryState {
  seen: string[];
  defeated: string[];
}

export class Story {
  private seen = new Set<string>();
  private defeated = new Set<string>();

  constructor(state?: StoryState) {
    if (state) {
      for (const s of state.seen) this.seen.add(s);
      for (const d of state.defeated) this.defeated.add(d);
    }
  }

  hasSeen(id: string): boolean {
    return this.seen.has(id);
  }
  markSeen(id: string): void {
    this.seen.add(id);
  }

  isDefeated(id: string): boolean {
    return this.defeated.has(id);
  }
  defeatBoss(id: string): void {
    this.defeated.add(id);
  }

  /** The next boss to face at the Shrine (first undefeated in the ladder), or null if all done. */
  nextBoss(): HuntBoss | null {
    return HUNT_BOSSES.find((b) => !this.defeated.has(b.id)) ?? null;
  }

  allBossesDone(): boolean {
    return this.nextBoss() === null;
  }

  toJSON(): StoryState {
    return { seen: [...this.seen], defeated: [...this.defeated] };
  }

  static from(state: StoryState): Story {
    return new Story(state);
  }
}
