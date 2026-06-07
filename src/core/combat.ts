import type { Element, Grade, Phase, Telegraph, WardInterval } from './types';
import { CFG } from './config';
import { damageMultiplier } from './typechart';
import { makeRng, pick } from './rng';
import { ELEMENTS } from './types';
import { CURSES, type CurseId, type CurseDef } from './curses';
import { DEFAULT_PROFILE, type AttackProfile } from './patterns';

const RIME_PERFECT_MS = 90; // tightened window under the Rime curse
const SEAR_EXTRA_AETHER = 14;
const SHATTER_MISS_MULT = 1.7;
const UNMAKING_LEAK = 0.4; // fraction of damage that leaks through a "negated" Ward

export interface FloatText {
  id: number;
  text: string;
  kind: Grade | 'strike' | 'info';
  bornAt: number;
}

export interface CombatOptions {
  /** Element of the player's Wraith (affects incoming type matchups). */
  playerElement: Element;
  /** Seed for the encounter director. */
  seed?: number;
  /** Auto-spawn enemy telegraphs (true for play, false for deterministic tests). */
  autoDirector?: boolean;
  /** Player Wraith stats (defaults preserve the original prototype numbers). */
  stats?: Partial<PlayerStats>;
  /** Enemy stats. */
  enemy?: Partial<EnemyStats>;
  /** The enemy's attack pattern (per-Wraith rhythm). Defaults to a balanced profile. */
  profile?: AttackProfile;
}

export interface PlayerStats {
  vigor: number;
  aetherMax: number;
  aetherRegenPerMs: number;
  strikePower: number;
  bonusResolveOnPerfect: number;
}

export interface EnemyStats {
  vigor: number;
  powerMult: number;
  curse?: CurseId; // curse this enemy can inflict on a Miss
  curseChance?: number; // 0..1
}

function defaultPlayerStats(p?: Partial<PlayerStats>): PlayerStats {
  return {
    vigor: p?.vigor ?? CFG.playerVigor,
    aetherMax: p?.aetherMax ?? CFG.aetherMax,
    aetherRegenPerMs: p?.aetherRegenPerMs ?? CFG.aetherRegenPerMs,
    strikePower: p?.strikePower ?? CFG.strikePower,
    bonusResolveOnPerfect: p?.bonusResolveOnPerfect ?? 0,
  };
}

/**
 * The WARDBOUND combat simulation. Deterministic given inputs + time.
 * Drive it by calling update(now) each frame and the input methods on player action.
 * Time is supplied in ms (performance.now() in the browser). No DOM/engine deps.
 */
export class Combat {
  playerElement: Element;
  readonly startTime: number;

  phase: Phase = 'playing';
  aether: number;
  resolve = 0;
  playerVigor: number;
  playerVigorMax: number;
  enemyVigor: number;
  enemyVigorMax: number;
  momentum = 0;

  private ps: PlayerStats;
  private enemyPowerMult: number;
  private enemyCurse?: CurseId;
  private enemyCurseChance: number;
  private curses = new Map<CurseId, { until: number; charges: number }>();

  // Stats for the player to feel progress.
  perfects = 0;
  bestStreak = 0;
  private streak = 0;

  telegraphs: Telegraph[] = [];
  floats: FloatText[] = [];

  /** Currently-held Ward element (only one may be up at a time — true to OSRS protection). */
  activeElement: Element | null = null;
  private intervals: WardInterval[] = [];

  private now: number;
  private lastUpdate: number;
  private nextId = 1;
  private nextFloatId = 1;

  private rng: () => number;
  private auto: boolean;
  private profile: AttackProfile;
  private spawnCount = 0;
  private nextSpawnTick: number;

  constructor(now: number, opts: CombatOptions) {
    this.playerElement = opts.playerElement;
    this.startTime = now;
    this.now = now;
    this.lastUpdate = now;
    this.rng = makeRng(opts.seed ?? 1);
    this.auto = opts.autoDirector ?? true;
    this.profile = opts.profile ?? DEFAULT_PROFILE;
    this.nextSpawnTick = 2; // first attack lands a couple ticks in

    this.ps = defaultPlayerStats(opts.stats);
    this.enemyPowerMult = opts.enemy?.powerMult ?? 1;
    this.enemyCurse = opts.enemy?.curse;
    this.enemyCurseChance = opts.enemy?.curseChance ?? 0;
    this.aether = this.ps.aetherMax;
    this.playerVigor = this.ps.vigor;
    this.playerVigorMax = this.ps.vigor;
    this.enemyVigor = opts.enemy?.vigor ?? CFG.enemyVigor;
    this.enemyVigorMax = this.enemyVigor;
  }

  /** Swap in a different Wraith mid-battle: new element + stats + its current Vigor. */
  setActive(stats: Partial<PlayerStats>, element: Element, currentVigor: number, now: number): void {
    this.dropWard(now);
    this.ps = defaultPlayerStats(stats);
    this.playerElement = element;
    this.playerVigor = currentVigor;
    this.playerVigorMax = this.ps.vigor;
    this.aether = Math.min(this.aether, this.ps.aetherMax);
  }

  /** Max Aether for the active Wraith (renderer uses this for the bar). */
  get aetherMax(): number {
    return this.ps.aetherMax;
  }

  /** The enemy's attack-pattern name (for the HUD). */
  get profileName(): string {
    return this.profile.name;
  }

  // ---- curses ----
  applyCurse(id: CurseId, now: number): void {
    const def = CURSES[id];
    const e = this.curses.get(id);
    this.curses.set(id, {
      until: now + def.durationMs,
      charges: def.kind === 'charge' ? (e?.charges ?? 0) + 1 : 0,
    });
    this.float(`✦${def.short}`, 'info', now);
  }

  hasCurse(id: CurseId, now: number): boolean {
    const e = this.curses.get(id);
    if (!e) return false;
    if (now > e.until) {
      this.curses.delete(id);
      return false;
    }
    if (CURSES[id].kind === 'charge' && e.charges <= 0) return false;
    return true;
  }

  private consumeCurse(id: CurseId): void {
    const e = this.curses.get(id);
    if (!e) return;
    e.charges--;
    if (e.charges <= 0) this.curses.delete(id);
  }

  /** Active curses for the HUD. */
  activeCurses(now: number): CurseDef[] {
    const out: CurseDef[] = [];
    for (const id of Object.keys(CURSES) as CurseId[]) {
      if (this.hasCurse(id, now)) out.push(CURSES[id]);
    }
    return out;
  }

  // ---- time helpers ----
  tickIndexAt(t: number): number {
    return Math.floor((t - this.startTime) / CFG.tickMs);
  }
  timeOfTick(i: number): number {
    return this.startTime + i * CFG.tickMs;
  }
  /** 0..1 progress through the current tick — used by the renderer for the Knell pulse. */
  tickProgress(): number {
    const x = (this.now - this.startTime) / CFG.tickMs;
    return x - Math.floor(x);
  }

  // ---- input ----
  raiseWard(element: Element, now: number): void {
    if (this.phase !== 'playing') return;
    if (this.aether <= 0) return; // can't raise a Ward with no Aether
    if (this.activeElement === element) return; // already up
    // Drop whatever was up, raise the new one (one Ward at a time).
    this.dropWard(now);
    this.activeElement = element;
    this.intervals.push({ element, start: now, end: null });
    if (this.hasCurse('sear', now)) {
      this.aether = Math.max(0, this.aether - SEAR_EXTRA_AETHER); // Sear: the next Ward costs extra
      this.consumeCurse('sear');
    }
    this.pruneIntervals(now);
  }

  dropWard(now: number): void {
    if (this.activeElement === null) return;
    const open = this.intervals.find((iv) => iv.end === null);
    if (open) open.end = now;
    this.activeElement = null;
  }

  /** Release a specific key — only drops if that element is the one currently held. */
  releaseWard(element: Element, now: number): void {
    if (this.activeElement === element) this.dropWard(now);
  }

  strike(now: number): boolean {
    if (this.phase !== 'playing') return false;
    if (this.resolve < CFG.strikeCost) return false;
    this.resolve -= CFG.strikeCost;
    const dmg = Math.round(this.ps.strikePower);
    this.enemyVigor = Math.max(0, this.enemyVigor - dmg);
    this.float(`STRIKE -${dmg}`, 'strike', now);
    if (this.enemyVigor <= 0) this.phase = 'won';
    return true;
  }

  /** For tests: inject a telegraph directly. */
  addTelegraph(t: Omit<Telegraph, 'id' | 'resolved' | 'flipped'> & Partial<Pick<Telegraph, 'flipped'>>): Telegraph {
    const tel: Telegraph = {
      id: this.nextId++,
      resolved: false,
      flipped: t.feintFrom ? false : true,
      ...t,
    };
    this.telegraphs.push(tel);
    return tel;
  }

  // ---- main step ----
  update(now: number): void {
    this.now = now;
    const dt = Math.max(0, now - this.lastUpdate);
    this.lastUpdate = now;

    if (this.phase !== 'playing') return;

    // Aether economy.
    if (this.activeElement) {
      const drainMult = this.hasCurse('drown', now) ? 1.6 : 1; // Drown: faster drain
      this.aether = Math.max(0, this.aether - dt * CFG.aetherDrainPerMs * drainMult);
      if (this.aether <= 0) this.dropWard(now); // burned out — Ward collapses
    } else {
      this.aether = Math.min(this.ps.aetherMax, this.aether + dt * this.ps.aetherRegenPerMs);
    }

    if (this.auto) this.runDirector(now);

    // Flip feints on their final beat (display only).
    for (const t of this.telegraphs) {
      if (t.feintFrom && !t.flipped && now >= this.timeOfTick(t.landingTick) - CFG.tickMs) {
        t.flipped = true;
      }
    }

    // Resolve any telegraph whose landing instant has passed.
    for (const t of this.telegraphs) {
      if (!t.resolved && now >= this.timeOfTick(t.landingTick)) {
        this.resolveTelegraph(t, now);
      }
    }

    // Cleanup.
    this.telegraphs = this.telegraphs.filter((t) => !t.resolved || now - this.timeOfTick(t.landingTick) < 700);
    this.floats = this.floats.filter((f) => now - f.bornAt < 900);
    this.pruneIntervals(now);

    if (this.playerVigor <= 0) this.phase = 'lost';
  }

  // ---- grading ----
  private resolveTelegraph(t: Telegraph, now: number): void {
    const landing = this.timeOfTick(t.landingTick);
    const eff = t.element;

    // Find a covering interval of the correct element (latest start = snappiest flick).
    let coveredRaisedAt: number | null = null;
    for (const iv of this.intervals) {
      if (iv.element !== eff) continue;
      const end = iv.end ?? now;
      if (iv.start <= landing && landing <= end) {
        if (coveredRaisedAt === null || iv.start > coveredRaisedAt) coveredRaisedAt = iv.start;
      }
    }

    const perfMs = this.hasCurse('rime', now) ? RIME_PERFECT_MS : CFG.perfectMs; // Rime: tighter window
    let grade: Grade;
    if (coveredRaisedAt !== null) {
      grade = landing - coveredRaisedAt <= perfMs ? 'perfect' : 'clean';
    } else {
      // Graze: correct-element Ward that just barely missed the landing instant.
      let graze = false;
      for (const iv of this.intervals) {
        if (iv.element !== eff) continue;
        const end = iv.end ?? now;
        if (end < landing && landing - end <= CFG.grazeMs) graze = true; // dropped just early
        if (iv.start > landing && iv.start - landing <= CFG.grazeMs) graze = true; // raised just late
      }
      grade = graze ? 'graze' : 'miss';
    }

    t.grade = grade;
    t.resolved = true;
    this.applyGrade(grade, t, now);
  }

  private applyGrade(grade: Grade, t: Telegraph, now: number): void {
    const bonus = grade === 'perfect' ? this.ps.bonusResolveOnPerfect : 0;
    const sap = this.hasCurse('sap', now) ? 0.5 : 1; // Sap: less Resolve
    this.resolve = Math.min(CFG.resolveMax, this.resolve + (CFG.resolveGain[grade] + bonus) * sap);

    const mult = damageMultiplier(t.element, this.playerElement);
    const dmg = t.power * mult * (1 + this.momentum * CFG.momentumDamagePerStack) * this.enemyPowerMult;

    if (grade === 'miss') {
      let d = dmg;
      if (this.hasCurse('shatter', now)) {
        d *= SHATTER_MISS_MULT; // Shatter: this Miss hits harder
        this.consumeCurse('shatter');
      }
      this.playerVigor = Math.max(0, this.playerVigor - d);
      this.momentum++;
      this.streak = 0;
      this.tryEnemyCurse(now);
    } else if (grade === 'graze') {
      this.playerVigor = Math.max(0, this.playerVigor - 0.5 * dmg);
      this.streak = 0;
    } else {
      // perfect / clean normally negate fully — unless Unmaking leaks some through
      if (this.hasCurse('unmaking', now)) this.playerVigor = Math.max(0, this.playerVigor - UNMAKING_LEAK * dmg);
      if (grade === 'perfect') {
        this.perfects++;
        this.streak++;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        this.momentum = 0; // a Perfect resets enemy Momentum
      } else {
        this.streak = 0;
      }
    }

    this.float(grade.toUpperCase(), grade, now);
  }

  private tryEnemyCurse(now: number): void {
    if (this.enemyCurse && this.rng() < this.enemyCurseChance) this.applyCurse(this.enemyCurse, now);
  }

  // ---- encounter director (per-Wraith profile, escalating intensity) ----
  private runDirector(now: number): void {
    const curTick = this.tickIndexAt(now);
    if (curTick < this.nextSpawnTick) return;

    const p = this.profile;
    const inten = Math.min(1, this.spawnCount / 12); // ramps up over the fight
    const spacing = Math.max(p.minSpacing, Math.round(p.baseSpacing - (p.baseSpacing - p.minSpacing) * inten));
    const element = this.rng() < p.primaryBias ? p.elements[0] : pick(this.rng, p.elements);
    const power = p.basePower * (0.8 + 0.5 * inten);
    const feint = this.rng() < p.feintChance * inten;
    const landing = curTick + p.lead;

    this.addTelegraph({ element, landingTick: landing, power, feintFrom: feint ? this.pickDifferent(element) : undefined });

    if (this.rng() < p.splitChance * inten) {
      const e2 = this.rng() < 0.5 ? element : pick(this.rng, p.elements); // a second hit on the next tick
      this.addTelegraph({ element: e2, landingTick: landing + 1, power });
    }

    this.spawnCount++;
    this.nextSpawnTick = curTick + spacing;
  }

  private pickDifferent(e: Element): Element {
    let other = pick(this.rng, ELEMENTS);
    while (other === e) other = pick(this.rng, ELEMENTS);
    return other;
  }

  // ---- misc ----
  private float(text: string, kind: FloatText['kind'], now: number): void {
    this.floats.push({ id: this.nextFloatId++, text, kind, bornAt: now });
  }

  private pruneIntervals(now: number): void {
    // Keep only intervals that could still matter (recent), cap memory.
    this.intervals = this.intervals.filter((iv) => (iv.end ?? now) > now - 2 * CFG.tickMs);
  }
}
