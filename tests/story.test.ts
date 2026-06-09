import { describe, it, expect } from 'vitest';
import { Story, HUNT_BOSSES } from '../src/core/story';

describe('Story & the Hunt (boss ladder)', () => {
  it('tracks seen beats', () => {
    const s = new Story();
    expect(s.hasSeen('intro')).toBe(false);
    s.markSeen('intro');
    expect(s.hasSeen('intro')).toBe(true);
  });

  it('advances the boss ladder as bosses are defeated', () => {
    const s = new Story();
    expect(s.nextBoss()?.id).toBe(HUNT_BOSSES[0].id);
    s.defeatBoss(HUNT_BOSSES[0].id);
    expect(s.nextBoss()?.id).toBe(HUNT_BOSSES[1].id);
  });

  it('reports completion when every boss is eased', () => {
    const s = new Story();
    for (const b of HUNT_BOSSES) s.defeatBoss(b.id);
    expect(s.nextBoss()).toBeNull();
    expect(s.allBossesDone()).toBe(true);
  });

  it('ends with Mourne', () => {
    expect(HUNT_BOSSES[HUNT_BOSSES.length - 1].speciesId).toBe('voidmoth');
  });

  it('survives a save/load round-trip', () => {
    const s = new Story();
    s.markSeen('firstbind');
    s.defeatBoss('echo_ember');
    const restored = Story.from(JSON.parse(JSON.stringify(s.toJSON())));
    expect(restored.hasSeen('firstbind')).toBe(true);
    expect(restored.isDefeated('echo_ember')).toBe(true);
  });
});
