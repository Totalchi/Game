import type { Element } from './types';

/** Curses attack your ability to FLICK, not just your health (docs/GAME_DESIGN.md §6). */
export type CurseId = 'sear' | 'drown' | 'static' | 'rime' | 'sap' | 'shatter' | 'unmaking';

export interface CurseDef {
  id: CurseId;
  name: string;
  short: string;
  desc: string;
  kind: 'timed' | 'charge'; // timed expires by clock; charge is consumed on its trigger
  durationMs: number;
  color: string;
}

export const CURSES: Record<CurseId, CurseDef> = {
  sear: { id: 'sear', name: 'Sear', short: 'SEAR', desc: 'Your next Ward costs extra Aether.', kind: 'charge', durationMs: 6000, color: '#ff5a1f' },
  drown: { id: 'drown', name: 'Drown', short: 'DROWN', desc: 'Aether drains faster.', kind: 'timed', durationMs: 2600, color: '#1fb6ff' },
  static: { id: 'static', name: 'Static', short: 'STATIC', desc: 'Telegraphs reveal later.', kind: 'timed', durationMs: 2600, color: '#a26bff' },
  rime: { id: 'rime', name: 'Rime', short: 'RIME', desc: 'Your Perfect window narrows.', kind: 'timed', durationMs: 2600, color: '#9fe8ff' },
  sap: { id: 'sap', name: 'Sap', short: 'SAP', desc: 'You gain less Resolve.', kind: 'timed', durationMs: 2600, color: '#6fcf57' },
  shatter: { id: 'shatter', name: 'Shatter', short: 'SHATTER', desc: 'Your next Miss hits harder.', kind: 'charge', durationMs: 6000, color: '#c8893f' },
  unmaking: { id: 'unmaking', name: 'Unmaking', short: 'UNMAKING', desc: "Wards can't fully negate.", kind: 'timed', durationMs: 3000, color: '#c77dff' },
};

/** Which curse an attack of a given element can inflict. */
export const ELEMENT_CURSE: Record<Element, CurseId> = {
  ember: 'sear',
  tide: 'drown',
  storm: 'static',
  stone: 'shatter',
  bloom: 'sap',
  frost: 'rime',
  hollow: 'unmaking',
};
