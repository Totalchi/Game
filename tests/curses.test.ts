import { describe, it, expect } from 'vitest';
import { Combat } from '../src/core/combat';
import { CFG } from '../src/core/config';

function mk(playerElement: 'ember' | 'tide' = 'ember') {
  return new Combat(0, { playerElement, autoDirector: false });
}

describe('Curses (attacking the flick itself)', () => {
  it('Rime narrows the Perfect window (a would-be Perfect becomes Clean)', () => {
    const c = mk('ember');
    const t = c.addTelegraph({ element: 'ember', landingTick: 5, power: 10 }); // lands at 3000
    c.applyCurse('rime', 2900);
    c.raiseWard('ember', 2900); // 100ms early — Perfect normally (<=150), Clean under Rime (<=90)
    c.update(3010);
    expect(t.grade).toBe('clean');
  });

  it('Sap halves Resolve gain', () => {
    const c = mk('ember');
    c.addTelegraph({ element: 'ember', landingTick: 5, power: 10 });
    c.applyCurse('sap', 2900);
    c.raiseWard('ember', 2900);
    c.update(3010);
    expect(c.resolve).toBeCloseTo(CFG.resolveGain.perfect * 0.5, 5);
  });

  it('Sear makes the next Ward cost extra Aether (once)', () => {
    const c = mk('ember');
    c.applyCurse('sear', 0);
    c.raiseWard('ember', 0);
    expect(c.aether).toBeCloseTo(CFG.aetherMax - 14, 5);
    expect(c.hasCurse('sear', 0)).toBe(false); // consumed
  });

  it('Drown drains Aether faster while a Ward is held', () => {
    const c = mk('ember');
    c.applyCurse('drown', 0);
    c.raiseWard('ember', 0);
    c.update(600); // one tick held under Drown (1.6x of 8)
    expect(c.aether).toBeCloseTo(CFG.aetherMax - 8 * 1.6, 1);
  });

  it('Shatter makes the next Miss hit harder (once)', () => {
    const c = mk('ember');
    const t = c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 }); // neutral vs ember
    c.applyCurse('shatter', 2900);
    c.update(3010); // no Ward -> Miss, amplified
    expect(t.grade).toBe('miss');
    expect(c.playerVigor).toBeCloseTo(CFG.playerVigor - 20 * 1.7, 5);
  });

  it("Unmaking leaks damage through an otherwise-Perfect Ward", () => {
    const c = mk('ember');
    const t = c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 });
    c.applyCurse('unmaking', 2900);
    c.raiseWard('storm', 2900);
    c.update(3010);
    expect(t.grade).toBe('perfect'); // still graded Perfect (you earned the flick)
    expect(c.playerVigor).toBeCloseTo(CFG.playerVigor - 0.4 * 20, 5); // but some leaks through
  });

  it('an enemy inflicts its curse on a Miss', () => {
    const c = new Combat(0, { playerElement: 'ember', autoDirector: false, enemy: { vigor: 100, powerMult: 1, curse: 'drown', curseChance: 1 } });
    c.addTelegraph({ element: 'storm', landingTick: 3, power: 10 });
    c.update(1810); // Miss -> enemy applies Drown
    expect(c.hasCurse('drown', 1810)).toBe(true);
  });
});
