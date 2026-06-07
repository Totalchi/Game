import type { Element } from '../core/types';

/** Rarity tiers (see docs/RARITY.md). Higher = rarer = harder/longer Binding Rite. */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'revenant' | 'mythic';

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'revenant', 'mythic'];

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#cfd2e0',
  uncommon: '#6fcf57',
  rare: '#48c0ff',
  revenant: '#c77dff',
  mythic: '#ffae42',
};

/** A signature ability — each interacts with the flick loop, not just stats (docs/BESTIARY.md). */
export interface Signature {
  id: string;
  name: string;
  desc: string;
  bonusResolveOnPerfect?: number; // defense feeds offense
  strikePowerMult?: number; // harder Strikes
  aetherBonus?: number; // bigger Aether pool
  aetherRegenMult?: number; // faster Aether regen
}

export const SIGNATURES: Record<string, Signature> = {
  everburn: { id: 'everburn', name: 'Everburn', desc: 'Strikes hit 20% harder.', strikePowerMult: 1.2 },
  riptide: { id: 'riptide', name: 'Riptide', desc: 'Perfect Wards grant +6 bonus Resolve.', bonusResolveOnPerfect: 6 },
  tempo: { id: 'tempo', name: 'Tempo', desc: 'Aether regenerates 40% faster.', aetherRegenMult: 1.4 },
  aegis: { id: 'aegis', name: 'Aegis', desc: '+30 max Aether.', aetherBonus: 30 },
  wither: { id: 'wither', name: 'Wither', desc: 'Perfect Wards grant +3 Resolve.', bonusResolveOnPerfect: 3 },
  rime: { id: 'rime', name: 'Rime', desc: 'Strikes hit 12% harder.', strikePowerMult: 1.12 },
  unmaking: { id: 'unmaking', name: 'Unmaking', desc: 'Strikes hit 30% harder; ignores type.', strikePowerMult: 1.3 },
};

export interface Species {
  id: string;
  name: string;
  element: Element;
  rarity: Rarity;
  base: { vigor: number; aether: number; power: number };
  perLevel: { vigor: number; power: number };
  ascendsTo?: string;
  ascendLevel?: number;
  signature?: string; // key into SIGNATURES
  blurb: string;
}

function sp(s: Species): Species {
  return s;
}

/** The launch-ish roster (subset of docs/BESTIARY.md), data-driven. */
export const SPECIES: Record<string, Species> = {
  // --- Ember line (starter) ---
  ashling: sp({ id: 'ashling', name: 'Ashling', element: 'ember', rarity: 'common', base: { vigor: 90, aether: 100, power: 56 }, perLevel: { vigor: 6, power: 3 }, ascendsTo: 'cindreaver', ascendLevel: 8, blurb: 'A guttering ember-fox kit. Aggressive tempo.' }),
  cindreaver: sp({ id: 'cindreaver', name: 'Cindreaver', element: 'ember', rarity: 'uncommon', base: { vigor: 110, aether: 105, power: 64 }, perLevel: { vigor: 7, power: 4 }, ascendsTo: 'pyrelich', ascendLevel: 20, signature: 'everburn', blurb: 'A fox of cracked obsidian and living ember.' }),
  pyrelich: sp({ id: 'pyrelich', name: 'Pyrelich', element: 'ember', rarity: 'rare', base: { vigor: 140, aether: 110, power: 78 }, perLevel: { vigor: 8, power: 5 }, signature: 'everburn', blurb: 'A lich-fox wreathed in everburning fire.' }),

  // --- Tide line (starter) ---
  drippet: sp({ id: 'drippet', name: 'Drippet', element: 'tide', rarity: 'common', base: { vigor: 100, aether: 110, power: 48 }, perLevel: { vigor: 7, power: 2 }, ascendsTo: 'mournmaw', ascendLevel: 8, blurb: 'A weeping lantern-jelly. Attrition & control.' }),
  mournmaw: sp({ id: 'mournmaw', name: 'Mournmaw', element: 'tide', rarity: 'uncommon', base: { vigor: 124, aether: 120, power: 54 }, perLevel: { vigor: 8, power: 3 }, ascendsTo: 'sunkenlord', ascendLevel: 20, signature: 'riptide', blurb: 'A drowned spectral hound.' }),
  sunkenlord: sp({ id: 'sunkenlord', name: 'Sunkenlord', element: 'tide', rarity: 'rare', base: { vigor: 150, aether: 130, power: 62 }, perLevel: { vigor: 9, power: 4 }, signature: 'riptide', blurb: 'A leviathan-ghost of black water.' }),

  // --- Storm line (starter) ---
  sprite: sp({ id: 'sprite', name: 'Sprite', element: 'storm', rarity: 'common', base: { vigor: 84, aether: 100, power: 52 }, perLevel: { vigor: 5, power: 4 }, ascendsTo: 'galewisp', ascendLevel: 8, blurb: 'A flickering wind-mote. Reads & feints.' }),
  galewisp: sp({ id: 'galewisp', name: 'Galewisp', element: 'storm', rarity: 'uncommon', base: { vigor: 100, aether: 105, power: 60 }, perLevel: { vigor: 6, power: 5 }, ascendsTo: 'tempestrix', ascendLevel: 20, signature: 'tempo', blurb: 'A shrieking wind-wisp of forked light.' }),
  tempestrix: sp({ id: 'tempestrix', name: 'Tempestrix', element: 'storm', rarity: 'rare', base: { vigor: 120, aether: 115, power: 72 }, perLevel: { vigor: 7, power: 6 }, signature: 'tempo', blurb: 'A thunder-crowned storm-roc.' }),

  // --- Stone ---
  cairnling: sp({ id: 'cairnling', name: 'Cairnling', element: 'stone', rarity: 'common', base: { vigor: 130, aether: 90, power: 58 }, perLevel: { vigor: 9, power: 3 }, ascendsTo: 'gravemount', ascendLevel: 12, signature: 'aegis', blurb: 'A walking cairn-stone. The wall.' }),
  gravemount: sp({ id: 'gravemount', name: 'Gravemount', element: 'stone', rarity: 'rare', base: { vigor: 175, aether: 95, power: 70 }, perLevel: { vigor: 11, power: 4 }, signature: 'aegis', blurb: 'A mountain that remembers being a god.' }),

  // --- Bloom ---
  sporeling: sp({ id: 'sporeling', name: 'Sporeling', element: 'bloom', rarity: 'common', base: { vigor: 108, aether: 110, power: 50 }, perLevel: { vigor: 7, power: 3 }, ascendsTo: 'mossgrave', ascendLevel: 12, signature: 'wither', blurb: 'Fungal decay given will. Stall & disruption.' }),
  mossgrave: sp({ id: 'mossgrave', name: 'Mossgrave Hierophant', element: 'bloom', rarity: 'rare', base: { vigor: 140, aether: 120, power: 60 }, perLevel: { vigor: 9, power: 4 }, signature: 'wither', blurb: 'A priest of rot.' }),

  // --- Frost ---
  rimeling: sp({ id: 'rimeling', name: 'Rimeling', element: 'frost', rarity: 'common', base: { vigor: 96, aether: 100, power: 56 }, perLevel: { vigor: 6, power: 4 }, ascendsTo: 'glaciax', ascendLevel: 12, signature: 'rime', blurb: 'A black-ice spirit. Pressure.' }),
  glaciax: sp({ id: 'glaciax', name: 'Glaciax', element: 'frost', rarity: 'rare', base: { vigor: 130, aether: 105, power: 68 }, perLevel: { vigor: 8, power: 5 }, signature: 'rime', blurb: 'A glacier of a thousand frozen screams.' }),

  // --- Revenant (very rare wild) ---
  embereon: sp({ id: 'embereon', name: 'Embereon', element: 'ember', rarity: 'revenant', base: { vigor: 160, aether: 120, power: 84 }, perLevel: { vigor: 9, power: 6 }, signature: 'everburn', blurb: 'A revenant of the first fire. Apex.' }),
  brinewraith: sp({ id: 'brinewraith', name: 'Brinewraith', element: 'tide', rarity: 'revenant', base: { vigor: 170, aether: 135, power: 76 }, perLevel: { vigor: 10, power: 5 }, signature: 'riptide', blurb: 'A revenant of the drowned deep. Apex.' }),

  // --- Mythic (the chase) ---
  voidmoth: sp({ id: 'voidmoth', name: 'Voidmoth Mourne', element: 'hollow', rarity: 'mythic', base: { vigor: 190, aether: 140, power: 90 }, perLevel: { vigor: 11, power: 7 }, signature: 'unmaking', blurb: 'The death-echo of the seventh thing. The trophy.' }),
};

export const STARTER_IDS = ['ashling', 'drippet', 'sprite'] as const;

/** Wild encounter table for the Cinderwaste demo zone: [speciesId, weight]. */
export const CINDERWASTE_SPAWNS: Array<[string, number]> = [
  ['ashling', 30],
  ['cairnling', 22],
  ['sporeling', 14],
  ['rimeling', 12],
  ['drippet', 10],
  ['sprite', 8],
  ['embereon', 3], // revenant — rare
  ['brinewraith', 1], // revenant — very rare
  ['voidmoth', 1], // mythic — the dream
];

/** ~1 in N wild Wraiths is an Aberrant (prestige "shiny" variant; cosmetic only). */
export const ABERRANT_RATE = 40;
