import { describe, it, expect } from 'vitest';
import { Combat } from '../src/core/combat';
import { CFG } from '../src/core/config';
import { BindingRite } from '../src/core/binding';

describe('Perfect counter (defense feeds offense)', () => {
  it('a Perfect flick automatically counters for a slice of Strike power', () => {
    const c = new Combat(0, { playerElement: 'ember', autoDirector: false, enemy: { vigor: 100, powerMult: 1 } });
    c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 }); // lands at 3000
    c.raiseWard('storm', 2900); // Perfect
    c.update(3010);
    const expected = 100 - Math.round(CFG.strikePower * CFG.counterOnPerfect);
    expect(c.enemyVigor).toBe(expected);
  });

  it('a Clean flick does not counter', () => {
    const c = new Combat(0, { playerElement: 'ember', autoDirector: false, enemy: { vigor: 100, powerMult: 1 } });
    c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 });
    c.raiseWard('storm', 2500); // early -> Clean
    c.update(3010);
    expect(c.enemyVigor).toBe(100);
  });

  it('a counter can win the battle', () => {
    const c = new Combat(0, { playerElement: 'ember', autoDirector: false, enemy: { vigor: 5, powerMult: 1 } });
    c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 });
    c.raiseWard('storm', 2900);
    c.update(3010);
    expect(c.phase).toBe('won');
  });

  it('the Binding Rite cannot be ended by counters (it ends by meter)', () => {
    const rite = new BindingRite(0, { element: 'ember', count: 3 });
    const strikes = rite.combat.telegraphs.map((t) => ({ el: t.element, landing: rite.combat.timeOfTick(t.landingTick) }));
    for (const s of strikes) {
      rite.raiseWard(s.el, s.landing - 100); // all Perfects -> counters fire
      rite.update(s.landing + 10);
    }
    expect(rite.combat.phase).toBe('playing'); // inner combat never 'won'
    expect(rite.finished).toBe(true);
    expect(rite.bound).toBe(true);
  });
});

describe('Strike feedback', () => {
  it('an underfunded Strike explains itself instead of failing silently', () => {
    const c = new Combat(0, { playerElement: 'ember', autoDirector: false });
    expect(c.strike(100)).toBe(false);
    expect(c.floats.some((f) => f.text.includes('RESOLVE'))).toBe(true);
  });
});
