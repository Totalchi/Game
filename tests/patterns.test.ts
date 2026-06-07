import { describe, it, expect } from 'vitest';
import { profileFor, DEFAULT_PROFILE } from '../src/core/patterns';
import { Combat } from '../src/core/combat';

describe('attack profiles', () => {
  it('gives each element a distinct archetype', () => {
    expect(profileFor('storm').name).toBe('Trickster');
    expect(profileFor('stone').name).toBe('Wall');
    expect(profileFor('ember').name).toBe('Aggressive');
    expect(profileFor('tide').name).toBe('Control');
  });

  it('routes the Unmaking signature (and Hollow) to the boss profile', () => {
    expect(profileFor('ember', 'unmaking').name).toBe('Unmaking');
    expect(profileFor('hollow').name).toBe('Unmaking');
  });

  it('makes the Wall slow & heavy with no splits, the Trickster split-happy', () => {
    const wall = profileFor('stone');
    const trick = profileFor('storm');
    expect(wall.splitChance).toBe(0);
    expect(wall.basePower).toBeGreaterThan(trick.basePower);
    expect(trick.splitChance).toBeGreaterThan(0.3);
    expect(trick.feintChance).toBeGreaterThan(0.3);
  });

  it('always lists the primary element first', () => {
    expect(profileFor('frost').elements[0]).toBe('frost');
    expect(DEFAULT_PROFILE.elements[0]).toBe('ember');
  });
});

describe('director', () => {
  it('auto-spawns telegraphs from a profile over time', () => {
    const c = new Combat(0, { playerElement: 'ember', autoDirector: true, profile: profileFor('stone') });
    c.update(0);
    expect(c.telegraphs.length).toBe(0); // nothing yet at t0
    c.update(1300); // past the first spawn tick
    expect(c.telegraphs.length).toBeGreaterThanOrEqual(1);
  });
});
