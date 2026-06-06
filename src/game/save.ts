import { Roster, type RosterState } from '../core/roster';

const KEY = 'wardbound.save.v1';

/** Load the saved Roster, or a fresh empty one. Browser-only (localStorage). */
export function loadRoster(): Roster {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return Roster.from(JSON.parse(s) as RosterState);
  } catch {
    /* ignore corrupt/absent save */
  }
  return new Roster();
}

export function saveRoster(r: Roster): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(r.toJSON()));
  } catch {
    /* storage may be unavailable; non-fatal */
  }
}
