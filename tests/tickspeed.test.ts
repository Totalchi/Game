import { describe, it, expect } from 'vitest';
import { Combat } from '../src/core/combat';

describe('configurable tick (practice mode)', () => {
  it('runs the sim on a custom tick length', () => {
    const c = new Combat(0, { playerElement: 'ember', autoDirector: false, tickMs: 800 });
    expect(c.tickMs).toBe(800);
    expect(c.timeOfTick(5)).toBe(4000);
    expect(c.tickIndexAt(1601)).toBe(2);
  });

  it('defaults to the 600ms Knell', () => {
    const c = new Combat(0, { playerElement: 'ember', autoDirector: false });
    expect(c.tickMs).toBe(600);
    expect(c.timeOfTick(5)).toBe(3000);
  });

  it('grades flicks against the custom tick (Perfect at an 800ms landing)', () => {
    const c = new Combat(0, { playerElement: 'ember', autoDirector: false, tickMs: 800 });
    const t = c.addTelegraph({ element: 'storm', landingTick: 5, power: 20 }); // lands at 4000ms
    c.raiseWard('storm', 4000 - 100); // inside the universal 150ms Perfect window
    c.update(4010);
    expect(t.grade).toBe('perfect');
  });

  it('a powerMult of 0 makes a Miss harmless (practice metronome)', () => {
    const c = new Combat(0, { playerElement: 'ember', autoDirector: false, enemy: { vigor: 1e9, powerMult: 0 } });
    c.addTelegraph({ element: 'storm', landingTick: 3, power: 20 });
    c.update(1810); // Miss — but no damage in practice
    expect(c.playerVigor).toBe(100);
    expect(c.phase).toBe('playing');
  });
});
