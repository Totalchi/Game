import { describe, it, expect } from 'vitest';
import { matchup, damageMultiplier, BEATS } from '../src/core/typechart';
import { ELEMENTS } from '../src/core/types';

describe('type chart', () => {
  it('encodes the documented wheel relationships', () => {
    expect(matchup('ember', 'bloom')).toBe('advantage');
    expect(matchup('bloom', 'ember')).toBe('disadvantage');
    expect(matchup('tide', 'storm')).toBe('disadvantage'); // storm beats tide
    expect(matchup('storm', 'tide')).toBe('advantage');
  });

  it('treats hollow as type-null (always neutral)', () => {
    for (const e of ELEMENTS) {
      expect(matchup('hollow', e)).toBe('neutral');
      expect(matchup(e, 'hollow')).toBe('neutral');
    }
  });

  it('is internally consistent: if A beats B, B does not beat A', () => {
    for (const a of ELEMENTS) {
      for (const b of BEATS[a]) {
        expect(BEATS[b]).not.toContain(a);
      }
    }
  });

  it('maps matchups to sensible damage multipliers', () => {
    expect(damageMultiplier('ember', 'bloom')).toBeGreaterThan(1);
    expect(damageMultiplier('bloom', 'ember')).toBeLessThan(1);
    expect(damageMultiplier('ember', 'storm')).toBe(1);
  });
});
