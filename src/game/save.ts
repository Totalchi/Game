import { Roster, type RosterState } from '../core/roster';
import { Sanctuary, type SanctuaryState } from '../core/sanctuary';

const KEY = 'wardbound.save.v2';

export interface GameSave {
  roster: RosterState;
  sanctuary: SanctuaryState;
}

/** Load the saved game, or fresh empty objects. Browser-only (localStorage). */
export function loadGame(): { roster: Roster; sanctuary: Sanctuary } {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const data = JSON.parse(s) as GameSave;
      return { roster: Roster.from(data.roster), sanctuary: Sanctuary.from(data.sanctuary) };
    }
  } catch {
    /* ignore corrupt/absent save */
  }
  return { roster: new Roster(), sanctuary: new Sanctuary() };
}

export function saveGame(roster: Roster, sanctuary: Sanctuary): void {
  try {
    const data: GameSave = { roster: roster.toJSON(), sanctuary: sanctuary.toJSON() };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage may be unavailable; non-fatal */
  }
}
