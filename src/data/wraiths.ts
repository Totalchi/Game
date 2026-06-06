import type { Element } from '../core/types';

/** A trimmed Wraith record for the prototype (full model lives in docs/BESTIARY.md). */
export interface WraithDef {
  id: string;
  name: string;
  element: Element;
  blurb: string;
}

/** The starter trio (see docs/BESTIARY.md). */
export const STARTERS: WraithDef[] = [
  { id: 'cindreaver', name: 'Cindreaver', element: 'ember', blurb: 'A cursed ember-fox. Aggressive tempo.' },
  { id: 'mournmaw', name: 'Mournmaw', element: 'tide', blurb: 'A drowned spectral hound. Attrition & control.' },
  { id: 'galewisp', name: 'Galewisp', element: 'storm', blurb: 'A shrieking wind-wisp. Reads & feints.' },
];

export const ENEMY = { name: 'Tempestrix', element: 'storm' as Element };
