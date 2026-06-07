import { describe, it, expect } from 'vitest';
import { makeMon, statsOf, gainXp, xpToNext } from '../src/core/mon';

describe('Mon stats & leveling', () => {
  it('scales stats with level', () => {
    const lo = statsOf(makeMon('cairnling', 1));
    const hi = statsOf(makeMon('cairnling', 20));
    expect(hi.vigor).toBeGreaterThan(lo.vigor);
    expect(hi.power).toBeGreaterThan(lo.power);
  });

  it('applies a signature (Aegis = +30 max Aether)', () => {
    const s = statsOf(makeMon('cairnling', 5));
    expect(s.signature?.id).toBe('aegis');
    // base aether 90 + 30 from Aegis
    expect(s.aether).toBe(120);
  });

  it('xpToNext grows with level', () => {
    expect(xpToNext(10)).toBeGreaterThan(xpToNext(1));
  });

  it('levels up and Ascends at the threshold', () => {
    const mon = makeMon('ashling', 7);
    const res = gainXp(mon, xpToNext(7)); // 7 -> 8 triggers Ascension
    expect(mon.level).toBe(8);
    expect(mon.speciesId).toBe('cindreaver');
    expect(res.ascended?.toName).toBe('Cindreaver');
  });

  it('can Ascend twice with enough XP (Ashling -> Cindreaver -> Pyrelich)', () => {
    const mon = makeMon('ashling', 1);
    gainXp(mon, 100000);
    expect(mon.speciesId).toBe('pyrelich');
    expect(mon.level).toBeGreaterThanOrEqual(20);
  });
});
