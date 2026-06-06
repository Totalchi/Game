import type { Element, Grade, Phase, Telegraph, WardInterval } from './types';
import { CFG } from './config';
import { damageMultiplier } from './typechart';
import { makeRng, pick } from './rng';
import { ELEMENTS } from './types';

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
}

/**
 * The WARDBOUND combat simulation. Deterministic given inputs + time.
 * Drive it by calling update(now) each frame and the input methods on player action.
 * Time is supplied in ms (performance.now() in the browser). No DOM/engine deps.
 */
export class Combat {
  readonly playerElement: Element;
  readonly startTime: number;

  phase: Phase = 'playing';
  aether: number = CFG.aetherMax;
  resolve = 0;
  playerVigor: number = CFG.playerVigor;
  enemyVigor: number = CFG.enemyVigor;
  momentum = 0;

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
  private spawnCount = 0;
  private nextSpawnTick: number;

  constructor(now: number, opts: CombatOptions) {
    this.playerElement = opts.playerElement;
    this.startTime = now;
    this.now = now;
    this.lastUpdate = now;
    this.rng = makeRng(opts.seed ?? 1);
    this.auto = opts.autoDirector ?? true;
    this.nextSpawnTick = 2; // first attack lands a couple ticks in
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
    this.enemyVigor = Math.max(0, this.enemyVigor - CFG.strikePower);
    this.float(`STRIKE -${CFG.strikePower}`, 'strike', now);
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
      this.aether = Math.max(0, this.aether - dt * CFG.aetherDrainPerMs);
      if (this.aether <= 0) this.dropWard(now); // burned out — Ward collapses
    } else {
      this.aether = Math.min(CFG.aetherMax, this.aether + dt * CFG.aetherRegenPerMs);
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

    let grade: Grade;
    if (coveredRaisedAt !== null) {
      grade = landing - coveredRaisedAt <= CFG.perfectMs ? 'perfect' : 'clean';
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
    this.resolve = Math.min(CFG.resolveMax, this.resolve + CFG.resolveGain[grade]);

    const mult = damageMultiplier(t.element, this.playerElement);
    const momentumMult = 1 + this.momentum * CFG.momentumDamagePerStack;

    if (grade === 'miss') {
      this.playerVigor = Math.max(0, this.playerVigor - t.power * mult * momentumMult);
      this.momentum++;
      this.streak = 0;
    } else if (grade === 'graze') {
      this.playerVigor = Math.max(0, this.playerVigor - 0.5 * t.power * mult * momentumMult);
      this.streak = 0;
    } else {
      // perfect / clean negate fully
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

  // ---- encounter director (escalating telegraphs) ----
  private runDirector(now: number): void {
    const curTick = this.tickIndexAt(now);
    if (curTick < this.nextSpawnTick) return;

    const stage = this.stage();
    const lead = stage >= 3 ? 2 : 3; // ticks of wind-up
    const spacing = [4, 3, 2, 2][Math.min(stage - 1, 3)];

    const element = this.pickElement(stage);
    const power = 10 + stage * 4;

    const feint = stage >= 4 && this.rng() < 0.35;
    this.addTelegraph({
      element,
      landingTick: curTick + lead,
      power,
      feintFrom: feint ? this.pickDifferent(element) : undefined,
    });

    this.spawnCount++;
    this.nextSpawnTick = curTick + spacing;
  }

  private stage(): number {
    if (this.spawnCount < 4) return 1; // single element, slow
    if (this.spawnCount < 9) return 2; // mixed (3 elements)
    if (this.spawnCount < 16) return 3; // all 6, faster
    return 4; // + feints
  }

  private pickElement(stage: number): Element {
    if (stage === 1) return 'ember';
    if (stage === 2) return pick(this.rng, ['ember', 'tide', 'storm'] as const);
    return pick(this.rng, ELEMENTS);
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
