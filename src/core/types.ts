/**
 * WARDBOUND core types. Pure data — no engine, no DOM.
 * See docs/COMBAT_DEEPDIVE.md for the design these mirror.
 */

export type Element = 'ember' | 'tide' | 'storm' | 'stone' | 'bloom' | 'frost' | 'hollow';

/** The six playable elements (Hollow is special/endgame and excluded from normal Wards). */
export const ELEMENTS: readonly Element[] = ['ember', 'tide', 'storm', 'stone', 'bloom', 'frost'];

export type Grade = 'perfect' | 'clean' | 'graze' | 'miss';

export type Phase = 'playing' | 'won' | 'lost';

/** An incoming enemy attack the player must Ward on its landing tick. */
export interface Telegraph {
  id: number;
  /** The true element that must be Warded. */
  element: Element;
  /** The tick index at which this attack lands. */
  landingTick: number;
  /** Damage dealt to the player on a Miss (Graze = half). */
  power: number;
  /** If set, the telegraph displays as this element until the final beat (a feint). */
  feintFrom?: Element;
  /** Whether the feint has flipped to its true element yet (display only). */
  flipped: boolean;
  resolved: boolean;
  grade?: Grade;
}

/** A window of time during which a Ward of `element` was raised. end===null while held. */
export interface WardInterval {
  element: Element;
  start: number;
  end: number | null;
}
