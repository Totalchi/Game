import { describe, it, expect } from 'vitest';
import { Sanctuary } from '../src/core/sanctuary';

describe('Sanctuary (base building)', () => {
  it('starts empty and gates upgrades on Beacon', () => {
    const s = new Sanctuary();
    expect(s.beacon).toBe(0);
    expect(s.levelOf('aetherfont')).toBe(0);
    expect(s.canAfford('aetherfont')).toBe(false);
    expect(s.upgrade('aetherfont')).toBe(false);
  });

  it('spends Beacon to upgrade, and costs rise each level', () => {
    const s = new Sanctuary();
    s.addBeacon(1000);
    const c0 = s.costOf('aetherfont');
    expect(s.upgrade('aetherfont')).toBe(true);
    expect(s.levelOf('aetherfont')).toBe(1);
    expect(s.beacon).toBe(1000 - c0);
    expect(s.costOf('aetherfont')).toBeGreaterThan(c0);
  });

  it('applies perks from structure levels', () => {
    const s = new Sanctuary();
    s.addBeacon(100000);
    s.upgrade('aetherfont'); // +6 max Aether
    s.upgrade('whetstone'); // +6% strike
    s.upgrade('archive'); // +12% xp
    s.upgrade('knellshrine'); // +15% beacon
    s.upgrade('hearth'); // tier 1
    expect(s.bonusAether()).toBe(6);
    expect(s.powerMult()).toBeCloseTo(1.06, 5);
    expect(s.xpMult()).toBeCloseTo(1.12, 5);
    expect(s.beaconMult()).toBeCloseTo(1.15, 5);
    expect(s.tier()).toBe(1);
  });

  it('caps at max level', () => {
    const s = new Sanctuary();
    s.addBeacon(1000000);
    for (let i = 0; i < 10; i++) s.upgrade('hearth');
    expect(s.isMaxed('hearth')).toBe(true);
    expect(s.levelOf('hearth')).toBe(5);
  });

  it('survives a save/load round-trip', () => {
    const s = new Sanctuary();
    s.addBeacon(500);
    s.upgrade('whetstone');
    s.upgrade('whetstone');
    const restored = Sanctuary.from(JSON.parse(JSON.stringify(s.toJSON())));
    expect(restored.levelOf('whetstone')).toBe(2);
    expect(restored.beacon).toBe(s.beacon);
  });
});
