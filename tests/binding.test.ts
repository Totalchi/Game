import { describe, it, expect } from 'vitest';
import { BindingRite } from '../src/core/binding';
import { CFG } from '../src/core/config';

/** Drive a rite: flick the correct Ward perfectly for every strike. */
function perfectAll(rite: BindingRite): void {
  // Snapshot the scheduled strikes (element + landing tick) up front.
  const strikes = rite.combat.telegraphs.map((t) => ({ el: t.element, landing: rite.combat.timeOfTick(t.landingTick) }));
  for (const s of strikes) {
    rite.raiseWard(s.el, s.landing - 100); // within the 150ms Perfect window
    rite.update(s.landing + 10);
  }
}

describe('BindingRite (catching as a skill)', () => {
  it('binds the Wraith when every strike is Perfect-Warded', () => {
    const rite = new BindingRite(0, { element: 'ember', count: 3 });
    perfectAll(rite);
    expect(rite.finished).toBe(true);
    expect(rite.bound).toBe(true);
    expect(rite.bindMeter).toBeGreaterThanOrEqual(rite.threshold);
  });

  it('fails to bind when every strike is Missed', () => {
    const rite = new BindingRite(0, { element: 'ember', count: 3 });
    const landings = rite.combat.telegraphs.map((t) => rite.combat.timeOfTick(t.landingTick));
    for (const l of landings) rite.update(l + 10); // never raise a Ward
    expect(rite.finished).toBe(true);
    expect(rite.bound).toBe(false);
  });

  it('cannot kill the player (Vigor is irrelevant during a Rite)', () => {
    const rite = new BindingRite(0, { element: 'ember', count: 5 });
    const landings = rite.combat.telegraphs.map((t) => rite.combat.timeOfTick(t.landingTick));
    for (const l of landings) rite.update(l + 10);
    expect(rite.combat.playerVigor).toBeGreaterThan(CFG.playerVigor);
  });
});
