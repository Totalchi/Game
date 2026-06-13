import { Roster, type RosterState } from '../core/roster';
import { Sanctuary, type SanctuaryState } from '../core/sanctuary';
import { SkillTree, type SkillTreeState } from '../core/skilltree';
import { Story, type StoryState } from '../core/story';
import { SPECIES } from '../data/species';

const KEY = 'wardbound.save.v4';

/** Local "leaderboard" records (Trials & Daily Ward best scores). */
export interface Records {
  trialBest: number;
  dailyKey: string;
  dailyBest: number;
}

export interface GameSave {
  roster: RosterState;
  sanctuary: SanctuaryState;
  skills: SkillTreeState;
  story: StoryState;
  records: Records;
}

export interface LoadedGame {
  roster: Roster;
  sanctuary: Sanctuary;
  skills: SkillTree;
  story: Story;
  records: Records;
}

function freshRecords(): Records {
  return { trialBest: 0, dailyKey: '', dailyBest: 0 };
}

// ---- defensive sanitizers (a save file is untrusted input) ----
function int(v: unknown, def: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : def;
  return Math.max(min, Math.min(max, n));
}
function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
function bool(v: unknown): boolean {
  return v === true;
}
function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function cleanRoster(v: unknown): RosterState {
  const o = obj(v);
  const party = arr(o.party)
    .map((m) => obj(m))
    .filter((m) => typeof m.speciesId === 'string' && SPECIES[m.speciesId as string]) // drop unknown species
    .map((m) => ({ speciesId: m.speciesId as string, level: int(m.level, 1, 1, 999), xp: int(m.xp, 0), aberrant: bool(m.aberrant) }));
  const dexRaw = obj(o.dex);
  const dex: RosterState['dex'] = {};
  for (const [k, val] of Object.entries(dexRaw)) {
    if (!SPECIES[k]) continue;
    const e = obj(val);
    dex[k] = { speciesId: k, bound: int(e.bound, 0), aberrant: bool(e.aberrant) };
  }
  const activeIndex = party.length ? int(o.activeIndex, 0, 0, party.length - 1) : 0;
  return { party, dex, activeIndex };
}

function cleanSanctuary(v: unknown): SanctuaryState {
  const o = obj(v);
  const levelsRaw = obj(o.levels);
  const levels: Record<string, number> = {};
  for (const [k, val] of Object.entries(levelsRaw)) levels[k] = int(val, 0, 0, 99);
  return { beacon: int(o.beacon, 0), levels };
}

function cleanSkills(v: unknown): SkillTreeState {
  const o = obj(v);
  const ranksRaw = obj(o.ranks);
  const ranks: Record<string, number> = {};
  for (const [k, val] of Object.entries(ranksRaw)) ranks[k] = int(val, 0, 0, 99);
  return { insight: int(o.insight, 0), ranks };
}

function cleanStory(v: unknown): StoryState {
  const o = obj(v);
  return { seen: arr(o.seen).filter((x) => typeof x === 'string') as string[], defeated: arr(o.defeated).filter((x) => typeof x === 'string') as string[] };
}

function cleanRecords(v: unknown): Records {
  const o = obj(v);
  return { trialBest: int(o.trialBest, 0), dailyKey: str(o.dailyKey), dailyBest: int(o.dailyBest, 0) };
}

/** Load the saved game, or fresh objects. All inputs are sanitized & clamped. */
export function loadGame(): LoadedGame {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as unknown;
      const d = obj(data);
      return {
        roster: Roster.from(cleanRoster(d.roster)),
        sanctuary: Sanctuary.from(cleanSanctuary(d.sanctuary)),
        skills: SkillTree.from(cleanSkills(d.skills)),
        story: Story.from(cleanStory(d.story)),
        records: cleanRecords(d.records),
      };
    }
  } catch {
    /* corrupt/absent save — start fresh rather than crash */
  }
  return { roster: new Roster(), sanctuary: new Sanctuary(), skills: new SkillTree(), story: new Story(), records: freshRecords() };
}

export function saveGame(roster: Roster, sanctuary: Sanctuary, skills: SkillTree, story: Story, records: Records): void {
  try {
    const data: GameSave = { roster: roster.toJSON(), sanctuary: sanctuary.toJSON(), skills: skills.toJSON(), story: story.toJSON(), records };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage may be unavailable / full; non-fatal */
  }
}
