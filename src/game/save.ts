import { Roster, type RosterState } from '../core/roster';
import { Sanctuary, type SanctuaryState } from '../core/sanctuary';
import { SkillTree, type SkillTreeState } from '../core/skilltree';
import { Story, type StoryState } from '../core/story';

const KEY = 'wardbound.save.v4';

/** Local "leaderboard" records (Trials & Daily Ward best scores). */
export interface Records {
  trialBest: number;
  dailyKey: string; // ISO date the daily best belongs to
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

/** Load the saved game, or fresh empty objects. Browser-only (localStorage). */
export function loadGame(): LoadedGame {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const data = JSON.parse(s) as Partial<GameSave>;
      return {
        roster: data.roster ? Roster.from(data.roster) : new Roster(),
        sanctuary: data.sanctuary ? Sanctuary.from(data.sanctuary) : new Sanctuary(),
        skills: data.skills ? SkillTree.from(data.skills) : new SkillTree(),
        story: data.story ? Story.from(data.story) : new Story(),
        records: data.records ?? freshRecords(),
      };
    }
  } catch {
    /* ignore corrupt/absent save */
  }
  return { roster: new Roster(), sanctuary: new Sanctuary(), skills: new SkillTree(), story: new Story(), records: freshRecords() };
}

export function saveGame(roster: Roster, sanctuary: Sanctuary, skills: SkillTree, story: Story, records: Records): void {
  try {
    const data: GameSave = {
      roster: roster.toJSON(),
      sanctuary: sanctuary.toJSON(),
      skills: skills.toJSON(),
      story: story.toJSON(),
      records,
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage may be unavailable; non-fatal */
  }
}
