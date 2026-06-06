import { describe, it, expect } from 'vitest';
import { Combat } from '../src/core/combat';
import { CFG } from '../src/core/config';

/** Helper: a fresh deterministic combat with the director off so we control telegraphs. */
function mk(playerElement: 'ember' | 'tide' | 'storm' = 'ember') {
  return new Combat(0, { playerElement, autoDirector: false });
}

describe('flick grading', () => {
  it('PERFECT: correct Ward snapped within the perfect window negates and pays max Resolve', () => {
    const c = mk('ember');
    const t = c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 }); // storm vs ember = neutral
    c.raiseWard('storm', 3000 - 100); // 100ms before landing (<150 perfect)
    c.update(3010);
    expect(t.grade).toBe('perfect');
    expect(c.playerVigor).toBe(CFG.playerVigor); // negated
    expect(c.resolve).toBe(CFG.resolveGain.perfect);
    expect(c.perfects).toBe(1);
  });

  it('CLEAN: correct Ward raised early still negates but pays less Resolve', () => {
    const c = mk('ember');
    const t = c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 });
    c.raiseWard('storm', 3000 - 400); // 400ms early -> Clean, not Perfect
    c.update(3010);
    expect(t.grade).toBe('clean');
    expect(c.playerVigor).toBe(CFG.playerVigor);
    expect(c.resolve).toBe(CFG.resolveGain.clean);
    expect(c.perfects).toBe(0);
  });

  it('GRAZE: correct Ward dropped just before landing takes half damage', () => {
    const c = mk('ember');
    const t = c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 });
    c.raiseWard('storm', 3000 - 400);
    c.dropWard(3000 - 100); // dropped 100ms early (within grazeMs 130)
    c.update(3010);
    expect(t.grade).toBe('graze');
    expect(c.playerVigor).toBeCloseTo(CFG.playerVigor - 0.5 * 20, 5);
  });

  it('MISS (no Ward): full damage and the enemy gains Momentum', () => {
    const c = mk('ember');
    const t = c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 });
    c.update(3010);
    expect(t.grade).toBe('miss');
    expect(c.playerVigor).toBeCloseTo(CFG.playerVigor - 20, 5);
    expect(c.momentum).toBe(1);
  });

  it('MISS (wrong Ward): protecting the wrong element does not save you', () => {
    const c = mk('ember');
    const t = c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 });
    c.raiseWard('tide', 3000 - 100); // wrong element held over landing
    c.update(3010);
    expect(t.grade).toBe('miss');
    expect(c.playerVigor).toBeLessThan(CFG.playerVigor);
  });
});

describe('type advantage shapes incoming damage', () => {
  it('an advantaged attack hits a Missing defender harder', () => {
    // storm beats tide -> a storm attack vs a tide Wraith is amplified.
    const c = mk('tide');
    c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 });
    c.update(3010);
    expect(c.playerVigor).toBeCloseTo(CFG.playerVigor - 20 * 1.25, 5);
  });
});

describe('Momentum', () => {
  it('a Perfect resets the enemy Momentum built by a Miss', () => {
    const c = mk('ember');
    c.addTelegraph({ element: 'storm', landingTick: 3, power: 20 }); // miss -> momentum 1
    c.update(1810);
    expect(c.momentum).toBe(1);
    const t2 = c.addTelegraph({ element: 'storm', landingTick: 7, power: 20 });
    c.raiseWard('storm', 4200 - 100);
    c.update(4210);
    expect(t2.grade).toBe('perfect');
    expect(c.momentum).toBe(0);
  });
});

describe('Aether economy', () => {
  it('drains while a Ward is held and regenerates while down', () => {
    const c = mk('ember');
    c.update(0);
    c.raiseWard('ember', 0);
    c.update(600); // one tick held
    const afterHold = c.aether;
    expect(afterHold).toBeCloseTo(CFG.aetherMax - 8, 1);
    c.dropWard(600);
    c.update(1200); // one tick down
    expect(c.aether).toBeCloseTo(afterHold + 5, 1);
  });
});

describe('Strike economy', () => {
  it('spends Resolve to damage the enemy and refuses when too low', () => {
    const c = mk('ember');
    expect(c.strike(0)).toBe(false); // no resolve yet
    c.resolve = CFG.strikeCost;
    expect(c.strike(0)).toBe(true);
    expect(c.enemyVigor).toBe(CFG.enemyVigor - CFG.strikePower);
    expect(c.resolve).toBe(0);
  });

  it('wins when the enemy Vigor reaches zero', () => {
    const c = mk('ember');
    c.enemyVigor = CFG.strikePower;
    c.resolve = CFG.strikeCost;
    c.strike(0);
    expect(c.phase).toBe('won');
  });
});
