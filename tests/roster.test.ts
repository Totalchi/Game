import { describe, it, expect } from 'vitest';
import { Roster } from '../src/core/roster';

describe('Roster (collection + party)', () => {
  it('adds new species and increments duplicates', () => {
    const r = new Roster();
    expect(r.isEmpty()).toBe(true);
    expect(r.add('Ashling', 'ember')).toBe(true); // new
    expect(r.add('Ashling', 'ember')).toBe(false); // duplicate
    expect(r.add('Drippet', 'tide')).toBe(true);
    expect(r.speciesCount()).toBe(2);
    expect(r.totalBound()).toBe(3);
    expect(r.has('Drippet')).toBe(true);
    expect(r.has('Nope')).toBe(false);
  });

  it('tracks and cycles the active Wraith', () => {
    const r = new Roster();
    r.add('Ashling', 'ember');
    r.add('Drippet', 'tide');
    r.add('Sprite', 'storm');
    expect(r.active().name).toBe('Ashling');
    r.cycle();
    expect(r.active().name).toBe('Drippet');
    r.cycle();
    r.cycle(); // wraps back to start
    expect(r.active().name).toBe('Ashling');
  });

  it('survives a save/load round-trip', () => {
    const r = new Roster();
    r.add('Ashling', 'ember');
    r.add('Ashling', 'ember');
    r.add('Sprite', 'storm');
    r.cycle();
    const restored = Roster.from(JSON.parse(JSON.stringify(r.toJSON())));
    expect(restored.totalBound()).toBe(3);
    expect(restored.speciesCount()).toBe(2);
    expect(restored.active().name).toBe('Sprite');
  });
});
