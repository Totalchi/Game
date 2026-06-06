import type { Element } from '../core/types';

/** Element hues from docs/ART_BIBLE.md §1 (colour + a shape letter for colourblind safety). */
export const ELEMENT_COLOR: Record<Element, string> = {
  ember: '#ff5a1f',
  tide: '#1fb6ff',
  storm: '#a26bff',
  stone: '#c8893f',
  bloom: '#6fcf57',
  frost: '#9fe8ff',
  hollow: '#5a5a6e',
};

/** A distinct glyph per element so play never relies on colour alone. */
export const ELEMENT_GLYPH: Record<Element, string> = {
  ember: '✦',
  tide: '≋',
  storm: '⚡',
  stone: '⬣',
  bloom: '❧',
  frost: '❄',
  hollow: '○',
};

export const GRADE_COLOR: Record<string, string> = {
  perfect: '#ffd54a',
  clean: '#8be9fd',
  graze: '#ffa657',
  miss: '#ff5555',
  strike: '#ff7ad9',
  info: '#cfd2e0',
};
