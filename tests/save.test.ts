import { describe, it, expect, beforeEach } from 'vitest';
import { loadGame, saveGame, type Records } from '../src/game/save';
import { Roster } from '../src/core/roster';
import { Sanctuary } from '../src/core/sanctuary';
import { SkillTree } from '../src/core/skilltree';
import { Story } from '../src/core/story';
import { makeMon } from '../src/core/mon';

const KEY = 'wardbound.save.v4';

// Minimal localStorage polyfill for the node test environment.
class MemStore {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

beforeEach(() => {
  (globalThis as any).localStorage = new MemStore();
});

describe('save hardening (untrusted input)', () => {
  it('returns fresh state on corrupt JSON without throwing', () => {
    localStorage.setItem(KEY, '{not valid json');
    const g = loadGame();
    expect(g.roster.isEmpty()).toBe(true);
    expect(g.sanctuary.beacon).toBe(0);
    expect(g.skills.insight).toBe(0);
  });

  it('drops party members with unknown species ids', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        roster: { party: [{ speciesId: 'ashling', level: 5, xp: 0, aberrant: false }, { speciesId: 'HACK', level: 9, xp: 0 }], dex: {}, activeIndex: 1 },
      }),
    );
    const g = loadGame();
    expect(g.roster.party.length).toBe(1);
    expect(g.roster.party[0].speciesId).toBe('ashling');
    expect(g.roster.activeIndex).toBe(0); // clamped into range
  });

  it('clamps negative / non-finite numbers', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        sanctuary: { beacon: -999, levels: { hearth: -3, aetherfont: 2 } },
        skills: { insight: Number.POSITIVE_INFINITY, ranks: { cons_regen: -1 } },
        records: { trialBest: -50, dailyBest: 'oops', dailyKey: 123 },
      }),
    );
    const g = loadGame();
    expect(g.sanctuary.beacon).toBe(0);
    expect(g.sanctuary.levelOf('hearth')).toBe(0);
    expect(g.sanctuary.levelOf('aetherfont')).toBe(2);
    expect(g.skills.insight).toBe(0);
    expect(g.skills.rankOf('cons_regen')).toBe(0);
    expect(g.records.trialBest).toBe(0);
    expect(g.records.dailyBest).toBe(0);
    expect(g.records.dailyKey).toBe('');
  });

  it('round-trips a real save', () => {
    const roster = new Roster();
    roster.addCatch(makeMon('ashling', 7));
    const sanct = new Sanctuary();
    sanct.addBeacon(40);
    sanct.upgrade('whetstone');
    const skills = new SkillTree();
    skills.addInsight(20);
    skills.buy('cons_regen');
    const story = new Story();
    story.defeatBoss('echo_ember');
    const records: Records = { trialBest: 12, dailyKey: '2026-06-13', dailyBest: 7 };
    saveGame(roster, sanct, skills, story, records);

    const g = loadGame();
    expect(g.roster.party[0].speciesId).toBe('ashling');
    expect(g.sanctuary.levelOf('whetstone')).toBe(1);
    expect(g.skills.rankOf('cons_regen')).toBe(1);
    expect(g.story.isDefeated('echo_ember')).toBe(true);
    expect(g.records.trialBest).toBe(12);
  });
});
