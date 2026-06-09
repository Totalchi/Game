import { Roster, type RosterState } from '../core/roster';
import { Sanctuary, type SanctuaryState } from '../core/sanctuary';
import { SkillTree, type SkillTreeState } from '../core/skilltree';

const KEY = 'wardbound.save.v3';

export interface GameSave {
  roster: RosterState;
  sanctuary: SanctuaryState;
  skills: SkillTreeState;
}

export interface LoadedGame {
  roster: Roster;
  sanctuary: Sanctuary;
  skills: SkillTree;
}

/** Load the saved game, or fresh empty objects. Browser-only (localStorage). */
export function loadGame(): LoadedGame {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const data = JSON.parse(s) as GameSave;
      return {
        roster: Roster.from(data.roster),
        sanctuary: Sanctuary.from(data.sanctuary),
        skills: data.skills ? SkillTree.from(data.skills) : new SkillTree(),
      };
    }
  } catch {
    /* ignore corrupt/absent save */
  }
  return { roster: new Roster(), sanctuary: new Sanctuary(), skills: new SkillTree() };
}

export function saveGame(roster: Roster, sanctuary: Sanctuary, skills: SkillTree): void {
  try {
    const data: GameSave = { roster: roster.toJSON(), sanctuary: sanctuary.toJSON(), skills: skills.toJSON() };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage may be unavailable; non-fatal */
  }
}
