import type { Element } from './types';
import { ELEMENTS } from './types';

/** How an enemy schedules its telegraphs — gives each Wraith its own combat rhythm. */
export interface AttackProfile {
  name: string;
  baseSpacing: number; // ticks between attacks at the start of a fight
  minSpacing: number; // floor as the fight intensifies
  lead: number; // wind-up ticks before an attack lands
  feintChance: number; // at full intensity
  splitChance: number; // chance to add a second hit on the next tick
  primaryBias: number; // chance to use the Wraith's own element
  basePower: number;
  elements: Element[]; // element pool (index 0 = primary)
}

function twoOthers(primary: Element): Element[] {
  const others = ELEMENTS.filter((e) => e !== primary);
  // deterministic spread so each element draws a stable little pool
  const i = ELEMENTS.indexOf(primary);
  return [others[i % others.length], others[(i + 2) % others.length]];
}

function withPool(primary: Element, p: Omit<AttackProfile, 'elements'>): AttackProfile {
  return { ...p, elements: [primary, ...twoOthers(primary)] };
}

/** The default (balanced) profile — also the fallback when none is supplied. */
export const DEFAULT_PROFILE: AttackProfile = withPool('ember', {
  name: 'Balanced',
  baseSpacing: 4,
  minSpacing: 2,
  lead: 3,
  feintChance: 0.15,
  splitChance: 0.12,
  primaryBias: 0.6,
  basePower: 14,
});

/** Build the attack profile for an enemy from its element + signature. */
export function profileFor(element: Element, signatureId?: string): AttackProfile {
  if (signatureId === 'unmaking' || element === 'hollow') {
    return withPool(element, { name: 'Unmaking', baseSpacing: 3, minSpacing: 2, lead: 2, feintChance: 0.45, splitChance: 0.45, primaryBias: 0.3, basePower: 16 });
  }
  switch (element) {
    case 'ember': // aggressive — fast, double-hits
      return withPool(element, { name: 'Aggressive', baseSpacing: 3, minSpacing: 2, lead: 3, feintChance: 0.12, splitChance: 0.28, primaryBias: 0.7, basePower: 14 });
    case 'tide': // control — slow, wide, curse-heavy
      return withPool(element, { name: 'Control', baseSpacing: 4, minSpacing: 3, lead: 3, feintChance: 0.05, splitChance: 0.05, primaryBias: 0.8, basePower: 13 });
    case 'storm': // trickster — feints & splits
      return withPool(element, { name: 'Trickster', baseSpacing: 3, minSpacing: 2, lead: 2, feintChance: 0.4, splitChance: 0.4, primaryBias: 0.5, basePower: 13 });
    case 'stone': // wall — slow, heavy, telegraphed
      return withPool(element, { name: 'Wall', baseSpacing: 5, minSpacing: 3, lead: 4, feintChance: 0, splitChance: 0, primaryBias: 0.85, basePower: 20 });
    case 'bloom': // stall
      return withPool(element, { name: 'Stall', baseSpacing: 4, minSpacing: 3, lead: 3, feintChance: 0.1, splitChance: 0.06, primaryBias: 0.8, basePower: 13 });
    case 'frost': // pressure
      return withPool(element, { name: 'Pressure', baseSpacing: 3, minSpacing: 2, lead: 3, feintChance: 0.15, splitChance: 0.12, primaryBias: 0.7, basePower: 15 });
    default:
      return withPool(element, { ...DEFAULT_PROFILE, name: 'Balanced' });
  }
}
