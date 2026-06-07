import { describe, it, expect } from 'vitest';
import { Roster } from '../src/core/roster';
import { makeMon } from '../src/core/mon';

describe('Roster (party + dex)', () => {
  it('binds new species and increments duplicates in the dex', () => {
    const r = new Roster();
    expect(r.isEmpty()).toBe(true);
    expect(r.addCatch(makeMon('ashling'))).toBe(true); // new species
    expect(r.addCatch(makeMon('ashling'))).toBe(false); // duplicate
    expect(r.addCatch(makeMon('drippet'))).toBe(true);
    expect(r.speciesCount()).toBe(2);
    expect(r.totalBound()).toBe(3);
  });

  it('caps the active party at 6 but still records overflow in the dex', () => {
    const r = new Roster();
    const ids = ['ashling', 'drippet', 'sprite', 'cairnling', 'sporeling', 'rimeling', 'glaciax'];
    for (const id of ids) r.addCatch(makeMon(id));
    expect(r.party.length).toBe(6);
    expect(r.speciesCount()).toBe(7);
  });

  it('cycles the active Wraith and wraps', () => {
    const r = new Roster();
    r.addCatch(makeMon('ashling'));
    r.addCatch(makeMon('drippet'));
    expect(r.active().speciesId).toBe('ashling');
    r.cycle();
    expect(r.active().speciesId).toBe('drippet');
    r.cycle();
    expect(r.active().speciesId).toBe('ashling');
  });

  it('survives a save/load round-trip', () => {
    const r = new Roster();
    r.addCatch(makeMon('ashling', 7));
    r.addCatch(makeMon('sprite', 4));
    r.cycle();
    const restored = Roster.from(JSON.parse(JSON.stringify(r.toJSON())));
    expect(restored.party.length).toBe(2);
    expect(restored.active().speciesId).toBe('sprite');
    expect(restored.totalBound()).toBe(2);
  });
});
