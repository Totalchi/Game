import { describe, it, expect } from 'vitest';
import { SkillTree } from '../src/core/skilltree';

describe('SkillTree (long-grind meta-progression)', () => {
  it('starts empty and gates purchases on Insight', () => {
    const t = new SkillTree();
    expect(t.insight).toBe(0);
    expect(t.rankOf('cons_regen')).toBe(0);
    expect(t.canBuy('cons_regen')).toBe(false);
    expect(t.buy('cons_regen')).toBe(false);
  });

  it('spends Insight; cost rises with rank (base*(rank+1))', () => {
    const t = new SkillTree();
    t.addInsight(1000);
    expect(t.costOf('cons_regen')).toBe(3); // base 3, rank 0
    expect(t.buy('cons_regen')).toBe(true);
    expect(t.rankOf('cons_regen')).toBe(1);
    expect(t.costOf('cons_regen')).toBe(6); // rank 1 -> base*2
    expect(t.insight).toBe(1000 - 3);
  });

  it('enforces prerequisites', () => {
    const t = new SkillTree();
    t.addInsight(1000);
    expect(t.prereqMet('cons_well')).toBe(false); // needs cons_regen rank 2
    t.buy('cons_regen');
    t.buy('cons_regen'); // rank 2
    expect(t.prereqMet('cons_well')).toBe(true);
    expect(t.canBuy('cons_well')).toBe(true);
  });

  it('aggregates perks from node ranks (timing never affected)', () => {
    const t = new SkillTree();
    t.addInsight(100000);
    t.buy('cons_regen'); // +8% regen
    t.buy('res_riposte'); // +2 resolve on perfect
    expect(t.aetherRegenMult()).toBeCloseTo(1.08, 5);
    expect(t.bonusResolve()).toBe(2);
  });

  it('is a long grind: total-to-complete is large and tracked', () => {
    expect(SkillTree.totalToComplete()).toBeGreaterThan(500);
    const t = new SkillTree();
    t.addInsight(1000);
    t.buy('cons_regen');
    expect(t.spent()).toBe(3);
  });

  it('survives a save/load round-trip', () => {
    const t = new SkillTree();
    t.addInsight(50);
    t.buy('cons_regen');
    t.buy('hun_eye');
    const restored = SkillTree.from(JSON.parse(JSON.stringify(t.toJSON())));
    expect(restored.rankOf('cons_regen')).toBe(1);
    expect(restored.rankOf('hun_eye')).toBe(1);
    expect(restored.insight).toBe(t.insight);
  });
});
