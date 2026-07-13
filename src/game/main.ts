import '../style.css';
import { Combat, type PlayerStats } from '../core/combat';
import { CFG } from '../core/config';
import { BindingRite } from '../core/binding';
import { ELEMENTS } from '../core/types';
import { render, renderRite, wardRect, strikeRect, drawMotes, drawVignette, type PartyPip } from './render';
import { drawWraith } from './sprites';
import { Audio } from './audio';
import { SPECIES, STARTER_IDS, RARITY_COLOR, type Rarity } from '../data/species';
import { makeMon, statsOf, gainXp, type Mon } from '../core/mon';
import { ELEMENT_CURSE, type CurseId } from '../core/curses';
import { profileFor, TRIAL_PROFILE, PRACTICE_PROFILE } from '../core/patterns';
import { BEATS, HUNT_BOSSES, type Beat } from '../core/story';
import { ELEMENT_COLOR } from './colors';
import { Fx } from './fx';
import { Overworld } from './overworld';
import { loadGame, saveGame } from './save';
import { STRUCTURES, TIER_FLAVOUR } from '../core/sanctuary';
import { SKILL_NODES, BRANCH_COLOR, SkillTree } from '../core/skilltree';

const KEY_TO_INDEX: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 };
const MOVE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd']);
const STARTERS = STARTER_IDS.map((id) => SPECIES[id]);
const SWAP_AETHER_COST = 15;
const SANCT_LIST_Y = 212; // shared by drawSanctuary() and its touch hit-test
const SANCT_ROW_H = 62;
const SKILL_LIST_Y = 78; // shared by drawSkillTree() and its touch hit-test
const SKILL_ROW_H = 26;
const SKILL_VISIBLE = 18; // rows visible before scrolling
let skillScroll = 0;

const app = document.getElementById('app')!;
const canvas = document.createElement('canvas');
canvas.width = 900;
canvas.height = 620;
app.appendChild(canvas);
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;

const audio = new Audio();

type Scene = 'title' | 'overworld' | 'battle' | 'rite' | 'sanctuary' | 'skilltree' | 'trial';
let scene: Scene = 'title';
let sanctSel = 0;
let overworld: Overworld | null = null;
let combat: Combat | null = null;
let rite: BindingRite | null = null;
let riteResolved = false;
let wild: Mon = makeMon('ashling');
let battleActive = 0;
let teamVigor: number[] = [];
let levelMsg = '';
let lastTick = -1;

const rawKeys = new Set<string>();
const heldWards = new Set<string>();

const game = loadGame();
let roster = game.roster;
let sanctuary = game.sanctuary;
let skills = game.skills;
let story = game.story;
let records = game.records;
let skillSel = 0;
if (!roster.isEmpty()) {
  overworld = new Overworld();
  scene = 'overworld';
}
function persist(): void {
  saveGame(roster, sanctuary, skills, story, records);
}

// Story beats (overlay), boss hunt, and Trials state.
let beatQueue: Beat[] = [];
let pendingBossStart: Mon | null = null;
let currentBossId: string | null = null;
let pendingBeats: Beat[] = []; // shown after returning to the overworld
type TrialKind = 'trial' | 'daily' | 'practice';
let trialKind: TrialKind = 'trial';
let trialEnded = false;

// Visual juice (cosmetic only — never touches the sim).
const fx = new Fx();
let lastFloatSeen = 0;
let lastEnemyHit = 0;
let lastPlayerHit = 0;

function queueBeat(b: Beat): void {
  beatQueue.push(b);
}
function advanceBeat(): void {
  beatQueue.shift();
  if (beatQueue.length === 0 && pendingBossStart) {
    const m = pendingBossStart;
    pendingBossStart = null;
    startBattle(performance.now(), m);
  }
}
function dateKey(): string {
  return new Date().toISOString().slice(0, 10);
}
function dailySeed(): number {
  let h = 2166136261;
  for (const ch of dateKey()) h = (Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0);
  return h % 1000000;
}

// ---------- stat helpers ----------
function playerStats(mon: Mon): Partial<PlayerStats> {
  const s = statsOf(mon);
  const sig = s.signature;
  return {
    vigor: s.vigor,
    aetherMax: s.aether + sanctuary.bonusAether() + skills.maxAetherBonus(), // Aether Font + Deep Well
    aetherRegenPerMs: CFG.aetherRegenPerMs * (sig?.aetherRegenMult ?? 1) * skills.aetherRegenMult(),
    aetherDrainPerMs: CFG.aetherDrainPerMs * skills.drainMult(), // Eternal Flame
    strikePower: s.power * (sig?.strikePowerMult ?? 1) * sanctuary.powerMult() * skills.strikePowerMult(),
    bonusResolveOnPerfect: (sig?.bonusResolveOnPerfect ?? 0) + skills.bonusResolve(), // Riposte
    resolveMax: CFG.resolveMax + skills.resolveCapBonus(), // Deep Reserve
    momentumMult: skills.momentumMult(), // Momentum Break
    curseDurMult: skills.curseDurMult(), // Calm Mind / Unbroken
  };
}

function enemyStats(mon: Mon): { vigor: number; powerMult: number; curse: CurseId; curseChance: number } {
  const s = statsOf(mon);
  let mult = 1 + (s.level - 5) * 0.03;
  let chance = 0;
  if (s.rarity === 'uncommon') chance = 0.2;
  else if (s.rarity === 'rare') {
    mult += 0.1;
    chance = 0.4;
  } else if (s.rarity === 'revenant') {
    mult += 0.2;
    chance = 0.6;
  } else if (s.rarity === 'mythic') {
    mult += 0.3;
    chance = 0.85;
  }
  // 1.2x keeps fights snappy (a common falls in ~2 Strikes + Perfect-counters; bosses are a
  // real barrage but never a sponge).
  return { vigor: Math.round(s.vigor * 1.2), powerMult: Math.max(0.6, mult), curse: ELEMENT_CURSE[s.element], curseChance: chance };
}

function riteFor(rarity: Rarity): { count: number; threshold: number } {
  switch (rarity) {
    case 'uncommon':
      return { count: 6, threshold: 63 };
    case 'rare':
      return { count: 7, threshold: 68 };
    case 'revenant':
      return { count: 8, threshold: 74 };
    case 'mythic':
      return { count: 9, threshold: 80 };
    default:
      return { count: 5, threshold: 60 };
  }
}

// ---------- scene transitions ----------
function startBattle(now: number, wildMon: Mon): void {
  wild = wildMon;
  const active = roster.active();
  const aStats = statsOf(active);
  const wStats = statsOf(wildMon);
  battleActive = roster.activeIndex;
  teamVigor = roster.party.map((m) => statsOf(m).vigor); // full heal each encounter (demo)
  combat = new Combat(now, {
    playerElement: aStats.element,
    seed: Math.floor(now) % 9999,
    autoDirector: true,
    stats: playerStats(active),
    enemy: enemyStats(wildMon),
    profile: profileFor(wStats.element, wStats.signature?.id),
  });
  combat.playerVigor = teamVigor[battleActive];
  heldWards.clear();
  lastTick = -1;
  lastFloatSeen = 0;
  levelMsg = '';
  scene = 'battle';
}

function swapTo(idx: number, now: number, forced: boolean): void {
  if (!combat || idx === battleActive) return;
  teamVigor[battleActive] = combat.playerVigor;
  battleActive = idx;
  const m = roster.party[idx];
  const s = statsOf(m);
  combat.setActive(playerStats(m), s.element, teamVigor[idx], now);
  if (!forced) combat.aether = Math.max(0, combat.aether - SWAP_AETHER_COST * skills.swapCostMult()); // Light Step
  audio.flick();
}

function aliveInDirection(dir: 1 | -1): number {
  const n = roster.party.length;
  for (let step = 1; step <= n; step++) {
    const idx = (battleActive + dir * step + n * step) % n;
    if (idx !== battleActive && teamVigor[idx] > 0) return idx;
  }
  return -1;
}

function applyWinXp(): void {
  const aMon = roster.party[battleActive];
  const wRarity = statsOf(wild).rarity;
  const gain = Math.round((8 + statsOf(wild).level * 3) * sanctuary.xpMult() * skills.xpMult()); // Archive + Scholar
  const res = gainXp(aMon, gain);
  if (res.ascended) {
    levelMsg = `${res.ascended.fromName} ascended into ${res.ascended.toName}!`;
    tellOnce('firstascend', BEATS.firstascend);
  } else if (res.leveledTo.length) levelMsg = `${statsOf(aMon).name} reached Lv${aMon.level}!`;
  sanctuary.addBeacon(6 * sanctuary.beaconMult() * skills.beaconMult()); // Beacon for the win
  skills.addInsight(wRarity === 'mythic' ? 5 : wRarity === 'revenant' ? 3 : 1); // Insight from battle
  persist();
}

function startRite(now: number): void {
  const s = statsOf(wild);
  const p = riteFor(s.rarity);
  rite = new BindingRite(now, { element: s.element, seed: Math.floor(now) % 9999, count: p.count, threshold: p.threshold, startBonus: skills.bindStart() });
  riteResolved = false;
  heldWards.clear();
  lastTick = -1;
  lastFloatSeen = 0;
  scene = 'rite';
}

function returnToOverworld(): void {
  combat = null;
  rite = null;
  scene = 'overworld';
  rawKeys.clear();
  for (const b of pendingBeats) queueBeat(b);
  pendingBeats = [];
  currentBossId = null;
}

/** Queue a one-time story beat (by id) to show after the player returns to the overworld. */
function tellOnce(id: string, beat: Beat): void {
  if (story.hasSeen(id)) return;
  story.markSeen(id);
  pendingBeats.push(beat);
}

function startTrial(now: number, kind: TrialKind): void {
  const active = roster.active();
  const s = statsOf(active);
  trialKind = kind;
  trialEnded = false;
  const practice = kind === 'practice';
  const seed = kind === 'daily' ? dailySeed() : Math.floor(Math.random() * 1e9);
  combat = new Combat(now, {
    playerElement: s.element,
    autoDirector: true,
    stats: playerStats(active),
    enemy: { vigor: 1e9, powerMult: practice ? 0 : 1 }, // practice: harmless metronome
    profile: practice ? PRACTICE_PROFILE : TRIAL_PROFILE,
    seed,
    tickMs: practice ? 800 : undefined, // a slower Knell to learn on
  });
  heldWards.clear();
  lastTick = -1;
  lastFloatSeen = 0;
  scene = 'trial';
}

function endTrial(): void {
  if (trialEnded || !combat || trialKind === 'practice') return;
  trialEnded = true;
  const score = combat.perfects;
  if (trialKind === 'daily') {
    if (records.dailyKey !== dateKey()) {
      records.dailyKey = dateKey();
      records.dailyBest = 0;
    }
    if (score > records.dailyBest) records.dailyBest = score;
  } else if (score > records.trialBest) {
    records.trialBest = score;
  }
  persist();
}

function summonBoss(): void {
  const boss = story.nextBoss() ?? HUNT_BOSSES[HUNT_BOSSES.length - 1]; // replayable once cleared
  currentBossId = boss.id;
  pendingBossStart = makeMon(boss.speciesId, boss.level);
  queueBeat({ title: boss.name, text: boss.intro });
}

function chooseStarter(i: number): void {
  roster.addCatch(makeMon(STARTERS[i].id, 5));
  if (!story.hasSeen('intro')) {
    story.markSeen('intro');
    queueBeat(BEATS.intro);
  }
  persist();
  overworld = new Overworld();
  scene = 'overworld';
}

// ---------- input ----------
window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') {
    audio.enabled = !audio.enabled;
    return;
  }

  // A story beat is showing — any advance key dismisses it; nothing else gets through.
  if (beatQueue.length > 0) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      advanceBeat();
    }
    return;
  }

  if (scene === 'title') {
    if (e.key === '1' || e.key === '2' || e.key === '3') chooseStarter(Number(e.key) - 1);
    return;
  }

  if (scene === 'overworld') {
    if (MOVE_KEYS.has(e.key)) rawKeys.add(e.key);
    else if (e.key === 'Tab') {
      e.preventDefault();
      roster.cycle();
      persist();
    } else if (e.key === 'k' || e.key === 'K') {
      skillSel = 0;
      scene = 'skilltree';
      rawKeys.clear();
    } else if (e.key === 't' || e.key === 'T') {
      startTrial(performance.now(), 'trial');
    } else if (e.key === 'y' || e.key === 'Y') {
      startTrial(performance.now(), 'daily');
    } else if (e.key === 'p' || e.key === 'P') {
      startTrial(performance.now(), 'practice');
    }
    return;
  }

  if (scene === 'trial') {
    if (!combat) return;
    if (combat.phase === 'lost') {
      if (e.key === 'Enter') returnToOverworld();
      return;
    }
    if (e.key === 'Escape') {
      returnToOverworld();
      return;
    }
    raiseWardKey(e);
    return;
  }

  if (scene === 'skilltree') {
    if (e.key === 'ArrowUp' || e.key === 'w') skillSel = (skillSel - 1 + SKILL_NODES.length) % SKILL_NODES.length;
    else if (e.key === 'ArrowDown' || e.key === 's') skillSel = (skillSel + 1) % SKILL_NODES.length;
    else if (e.key === 'Enter' || e.key === ' ') {
      if (skills.buy(SKILL_NODES[skillSel].id)) persist();
    } else if (e.key === 'Escape' || e.key === 'k' || e.key === 'K') {
      scene = 'overworld';
      rawKeys.clear();
    }
    return;
  }

  if (scene === 'sanctuary') {
    if (e.key === 'ArrowUp' || e.key === 'w') sanctSel = (sanctSel - 1 + STRUCTURES.length) % STRUCTURES.length;
    else if (e.key === 'ArrowDown' || e.key === 's') sanctSel = (sanctSel + 1) % STRUCTURES.length;
    else if (e.key === 'Enter' || e.key === ' ') {
      if (sanctuary.upgrade(STRUCTURES[sanctSel].id)) persist();
    } else if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
      scene = 'overworld';
      rawKeys.clear();
    }
    return;
  }

  if (scene === 'battle') {
    if (!combat) return;
    if (combat.phase !== 'playing') {
      if (e.key === 'Enter') returnToOverworld();
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      combat.strike(performance.now());
      return;
    }
    if (e.key === 'q' || e.key === 'Q') {
      const n = aliveInDirection(-1);
      if (n >= 0) swapTo(n, performance.now(), false);
      return;
    }
    if (e.key === 'e' || e.key === 'E') {
      const n = aliveInDirection(1);
      if (n >= 0) swapTo(n, performance.now(), false);
      return;
    }
    raiseWardKey(e);
    return;
  }

  if (scene === 'rite') {
    if (!rite) return;
    if (rite.finished) {
      if (e.key === 'Enter') returnToOverworld();
      return;
    }
    raiseWardKey(e);
  }
});

window.addEventListener('keyup', (e) => {
  rawKeys.delete(e.key);
  const idx = KEY_TO_INDEX[e.key];
  if (idx === undefined) return;
  const el = ELEMENTS[idx];
  heldWards.delete(e.key);
  const now = performance.now();
  if ((scene === 'battle' || scene === 'trial') && combat) combat.releaseWard(el, now);
  else if (scene === 'rite' && rite) rite.releaseWard(el, now);
  const fallbackKey = [...heldWards].pop();
  if (fallbackKey) {
    const fb = ELEMENTS[KEY_TO_INDEX[fallbackKey]];
    if ((scene === 'battle' || scene === 'trial') && combat) combat.raiseWard(fb, now);
    else if (scene === 'rite' && rite) rite.raiseWard(fb, now);
  }
});

function raiseWardKey(e: KeyboardEvent): void {
  const idx = KEY_TO_INDEX[e.key];
  if (idx === undefined || e.repeat) return;
  const el = ELEMENTS[idx];
  heldWards.add(e.key);
  const now = performance.now();
  if ((scene === 'battle' || scene === 'trial') && combat) combat.raiseWard(el, now);
  else if (scene === 'rite' && rite) rite.raiseWard(el, now);
  audio.flick();
}

// ---------- touch / pointer (mobile-web) ----------
canvas.style.touchAction = 'none';
let touchWardIdx: number | null = null;
let touchMoving = false;
const TOUCH_ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

function canvasPos(e: PointerEvent): [number, number] {
  const r = canvas.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * canvas.width, ((e.clientY - r.top) / r.height) * canvas.height];
}

/** Which Ward button sits at (x, y)? Uses the same geometry the renderer draws with. */
function wardIndexAt(x: number, y: number): number | null {
  for (let i = 0; i < ELEMENTS.length; i++) {
    const r = wardRect(i, canvas.width, canvas.height);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return null;
}

/** Hold-to-walk: move toward the touch, relative to the screen centre. */
function setTouchMove(x: number, y: number): void {
  for (const k of TOUCH_ARROWS) rawKeys.delete(k);
  const dx = x - canvas.width / 2;
  const dy = y - canvas.height / 2;
  rawKeys.add(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'));
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const [x, y] = canvasPos(e);
  const now = performance.now();

  if (beatQueue.length > 0) {
    advanceBeat();
    return;
  }

  if (scene === 'title') {
    const W = canvas.width;
    for (let i = 0; i < STARTERS.length; i++) {
      const cx0 = W / 2 - 300 + i * 200;
      if (x >= cx0 && x <= cx0 + 180 && y >= 264 && y <= 424) {
        chooseStarter(i);
        return;
      }
    }
    return;
  }

  if (scene === 'overworld') {
    touchMoving = true;
    setTouchMove(x, y);
    return;
  }

  if (scene === 'sanctuary') {
    if (y > canvas.height - 50) {
      scene = 'overworld';
      rawKeys.clear();
      return;
    }
    const i = Math.floor((y - SANCT_LIST_Y) / SANCT_ROW_H);
    if (i >= 0 && i < STRUCTURES.length && x >= 80 && x <= canvas.width - 80) {
      if (i === sanctSel) {
        if (sanctuary.upgrade(STRUCTURES[i].id)) persist();
      } else sanctSel = i;
    }
    return;
  }

  if (scene === 'skilltree') {
    if (y > canvas.height - 30) {
      scene = 'overworld';
      rawKeys.clear();
      return;
    }
    const i = skillScroll + Math.floor((y - SKILL_LIST_Y) / SKILL_ROW_H);
    if (i >= 0 && i < SKILL_NODES.length && x >= 40 && x <= canvas.width - 40) {
      if (i === skillSel) {
        if (skills.buy(SKILL_NODES[i].id)) persist();
      } else skillSel = i;
    }
    return;
  }

  // Combat-ish scenes: end states first, then Wards, then Strike.
  if (scene === 'battle' && combat && combat.phase !== 'playing') {
    returnToOverworld();
    return;
  }
  if (scene === 'rite' && rite && rite.finished) {
    returnToOverworld();
    return;
  }
  if (scene === 'trial' && combat && combat.phase === 'lost') {
    returnToOverworld();
    return;
  }

  const wi = wardIndexAt(x, y);
  if (wi !== null) {
    touchWardIdx = wi;
    const el = ELEMENTS[wi];
    if ((scene === 'battle' || scene === 'trial') && combat) combat.raiseWard(el, now);
    else if (scene === 'rite' && rite) rite.raiseWard(el, now);
    audio.flick();
    return;
  }
  // Tap the Resolve bar to Strike (battle only).
  if (scene === 'battle' && combat) {
    const r = strikeRect(canvas.width, canvas.height);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) combat.strike(now);
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (touchMoving && scene === 'overworld') {
    const [x, y] = canvasPos(e);
    setTouchMove(x, y);
  }
});

function endTouch(): void {
  if (touchMoving) {
    for (const k of TOUCH_ARROWS) rawKeys.delete(k);
    touchMoving = false;
  }
  if (touchWardIdx !== null) {
    const el = ELEMENTS[touchWardIdx];
    const now = performance.now();
    if ((scene === 'battle' || scene === 'trial') && combat) combat.releaseWard(el, now);
    else if (scene === 'rite' && rite) rite.releaseWard(el, now);
    touchWardIdx = null;
  }
}
canvas.addEventListener('pointerup', endTouch);
canvas.addEventListener('pointercancel', endTouch);

// ---------- title ----------
function drawTitle(): void {
  const W = canvas.width;
  const H = canvas.height;
  const now = performance.now();

  // Dusk backdrop with drifting embers.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a1428');
  bg.addColorStop(0.6, '#120f1a');
  bg.addColorStop(1, '#0b0a10');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawMotes(ctx, W, H, now, '#ff7a4a', 18);

  // The Knell behind the logo — the world's heartbeat, pulsing.
  const pulse = 1 - ((now / 600) % 1);
  ctx.fillStyle = `rgba(255, 90, 60, ${0.05 + pulse * 0.09})`;
  ctx.beginPath();
  ctx.arc(W / 2, 84, 120 + pulse * 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = '#ffd54a';
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 52px ui-monospace, monospace';
  ctx.fillText('WARDBOUND', W / 2, 96);
  ctx.restore();
  ctx.fillStyle = '#b9a7d8';
  ctx.font = 'italic 15px ui-monospace, monospace';
  ctx.fillText('Flick the tick. Bind the beast.', W / 2, 126);
  ctx.fillStyle = '#8f8fa3';
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText('Explore (arrows/WASD) · Tall grass hides wild Wraiths · Tab/Q/E switch', W / 2, 162);
  ctx.fillText('Battle: Ward (1–6) on the beat · SPACE Strike · weaken it, then bind it', W / 2, 184);
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.fillText('Choose your first Wraith — press 1, 2 or 3, or tap a card', W / 2, 226);

  STARTERS.forEach((s, i) => {
    const x = W / 2 - 300 + i * 200;
    const y = 264;
    const hover = Math.sin(now / 400 + i * 2.1) * 3;
    ctx.fillStyle = '#141220';
    ctx.fillRect(x, y, 180, 160);
    ctx.strokeStyle = ELEMENT_COLOR[s.element];
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 180, 160);
    ctx.lineWidth = 1;
    ctx.fillStyle = ELEMENT_COLOR[s.element];
    ctx.font = 'bold 16px ui-monospace, monospace';
    ctx.fillText(`${i + 1}. ${s.name}`, x + 90, y + 24);
    drawWraith(ctx, x + 90, y + 78 + hover, 34, { element: s.element, t: now + i * 500 });
    ctx.fillStyle = '#cfd2e0';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(s.element.toUpperCase(), x + 90, y + 126);
    ctx.fillStyle = '#8f8fa3';
    wrapText(ctx, s.blurb, x + 90, y + 143, 164, 13);
  });

  drawVignette(ctx, W, H);
}

function wrapText(c: CanvasRenderingContext2D, text: string, cx: number, y: number, maxW: number, lh: number): void {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (c.measureText(test).width > maxW && line) {
      c.fillText(line, cx, yy);
      line = w;
      yy += lh;
    } else {
      line = test;
    }
  }
  c.fillText(line, cx, yy);
}

function drawOverworldHud(stutter: boolean): void {
  const W = canvas.width;
  ctx.fillStyle = 'rgba(8,8,12,0.72)';
  ctx.fillRect(0, 0, W, 30);
  ctx.textAlign = 'left';
  ctx.fillStyle = stutter ? '#c77dff' : '#ffd54a';
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.fillText(stutter ? 'The Cinderwaste · ✦ KNELL STUTTER' : 'The Cinderwaste', 12, 20);

  ctx.font = '12px ui-monospace, monospace';
  let x = 320;
  for (const p of roster.partyLabels()) {
    ctx.fillStyle = p.active ? ELEMENT_COLOR[p.element] : '#6a6a78';
    const label = `${p.active ? '▸' : ''}${p.name} ${p.level}`;
    ctx.fillText(label, x, 20);
    x += ctx.measureText(label).width + 12;
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd54a';
  ctx.fillText(`◆ ${sanctuary.beacon}   ✸ ${skills.insight}`, W - 12, 14);
  ctx.fillStyle = '#7a7a8a';
  ctx.fillText('Sanctuary ↖ · K skills · T trials · Y daily · P practice · M mute · Tab switch', W - 12, 26);
}

function drawSanctuary(): void {
  const W = canvas.width;
  const H = canvas.height;
  const tier = sanctuary.tier();
  // Background brightens as the Hearth tier rises (the dusk lifting).
  const lift = Math.min(tier, 5) / 5;
  ctx.fillStyle = `rgb(${Math.round(14 + lift * 26)},${Math.round(13 + lift * 22)},${Math.round(19 + lift * 18)})`;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 30px ui-monospace, monospace';
  ctx.fillText('THE SANCTUARY', W / 2, 56);
  ctx.fillStyle = '#cfd2e0';
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText(TIER_FLAVOUR[Math.min(tier, TIER_FLAVOUR.length - 1)], W / 2, 80);
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 16px ui-monospace, monospace';
  ctx.fillText(`◆ ${sanctuary.beacon} Beacon`, W / 2, 100);

  drawBasePanorama(60, 112, W - 120, 88, lift);

  const x = 80;
  let y = SANCT_LIST_Y;
  const rowH = SANCT_ROW_H;
  STRUCTURES.forEach((s, i) => {
    const lvl = sanctuary.levelOf(s.id);
    const sel = i === sanctSel;
    ctx.fillStyle = sel ? '#1d1d2b' : '#141420';
    ctx.fillRect(x, y, W - 160, rowH - 12);
    ctx.strokeStyle = sel ? '#ffd54a' : '#2a2a38';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(x, y, W - 160, rowH - 12);
    ctx.lineWidth = 1;

    ctx.textAlign = 'left';
    ctx.fillStyle = sel ? '#ffd54a' : '#e8e8f0';
    ctx.font = 'bold 16px ui-monospace, monospace';
    ctx.fillText(s.name, x + 16, y + 24);
    // level dots
    let dots = '';
    for (let d = 0; d < s.maxLevel; d++) dots += d < lvl ? '▰' : '▱';
    ctx.fillStyle = '#8be9fd';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(dots, x + 16, y + 46);
    ctx.fillStyle = '#9a9aa8';
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(s.desc, x + 130, y + 46);

    // cost / status
    ctx.textAlign = 'right';
    if (sanctuary.isMaxed(s.id)) {
      ctx.fillStyle = '#6fcf57';
      ctx.font = 'bold 14px ui-monospace, monospace';
      ctx.fillText('MAX', W - 96, y + 34);
    } else {
      const cost = sanctuary.costOf(s.id);
      ctx.fillStyle = sanctuary.canAfford(s.id) ? '#ffd54a' : '#7a5a3a';
      ctx.font = 'bold 14px ui-monospace, monospace';
      ctx.fillText(`◆ ${cost}`, W - 96, y + 34);
    }
    y += rowH;
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7a7a8a';
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText('↑/↓ select   ·   ENTER upgrade   ·   ESC / B / tap-bottom  leave', W / 2, H - 18);
}

/** A living vignette of the home base — it rebuilds and brightens as you upgrade. */
function drawBasePanorama(x: number, y: number, w: number, h: number, lift: number): void {
  const ground = y + h - 14;
  // sky band
  const g = ctx.createLinearGradient(0, y, 0, ground);
  g.addColorStop(0, `rgb(${28 + lift * 60},${20 + lift * 36},${26 + lift * 30})`);
  g.addColorStop(1, '#15131c');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#2a2a38';
  ctx.strokeRect(x, y, w, h);
  // ground
  ctx.fillStyle = `rgb(${30 + lift * 20},${36 + lift * 24},${26 + lift * 16})`;
  ctx.fillRect(x, ground, w, y + h - ground);

  // The Hearth in the centre — a ruin that becomes a lit hall as its tier rises.
  const tier = sanctuary.levelOf('hearth');
  const hx = x + w / 2;
  ctx.fillStyle = tier > 0 ? '#4a4656' : '#2c2a37';
  ctx.fillRect(hx - 26, ground - 34, 52, 34); // hall
  ctx.fillStyle = '#5e3326';
  ctx.beginPath(); // roof
  ctx.moveTo(hx - 32, ground - 34);
  ctx.lineTo(hx, ground - 50);
  ctx.lineTo(hx + 32, ground - 34);
  ctx.closePath();
  ctx.fill();
  // hearth glow / windows light up with tier
  for (let i = 0; i < 3; i++) {
    const lit = i < tier;
    ctx.fillStyle = lit ? '#ffb24a' : '#1a1822';
    ctx.fillRect(hx - 18 + i * 14, ground - 24, 8, 10);
  }
  if (tier >= 5) {
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(performance.now() / 300);
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.arc(hx, ground - 30, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // A small structure marker for each built upgrade, dotted along the base.
  const built = STRUCTURES.filter((s) => s.id !== 'hearth' && sanctuary.levelOf(s.id) > 0);
  built.forEach((s, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const bx = hx + side * (60 + Math.floor(i / 2) * 46);
    const bh = 14 + sanctuary.levelOf(s.id) * 3;
    ctx.fillStyle = '#3a3746';
    ctx.fillRect(bx - 12, ground - bh, 24, bh);
    ctx.fillStyle = '#ffb24a';
    ctx.fillRect(bx - 4, ground - bh + 4, 3, 4); // a lit window
    ctx.fillStyle = '#9a9aa8';
    ctx.font = '8px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(s.name.replace(/^(The |Knell-)/, '').slice(0, 6), bx, ground + 9);
  });

  // survivors arrive as the dusk lifts
  if (tier >= 2) {
    ctx.fillStyle = '#cfd2e0';
    for (let i = 0; i < Math.min(tier, 4); i++) {
      const sx = hx - 18 + i * 12;
      ctx.fillRect(sx, ground - 8, 3, 8);
    }
  }
}

function drawSkillTree(): void {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#0c0b12';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 26px ui-monospace, monospace';
  ctx.fillText('THE WARDING TREE', W / 2, 40);
  const total = SkillTree.totalToComplete();
  ctx.fillStyle = '#cfd2e0';
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText(`✸ ${skills.insight} Insight   ·   completed ${Math.round((skills.spent() / total) * 100)}%  (${skills.spent()} / ${total})`, W / 2, 62);

  // keep the selected node within the scroll window
  if (skillSel < skillScroll) skillScroll = skillSel;
  else if (skillSel >= skillScroll + SKILL_VISIBLE) skillScroll = skillSel - SKILL_VISIBLE + 1;

  const x = 40;
  const rowW = W - 80;
  const last = Math.min(SKILL_NODES.length, skillScroll + SKILL_VISIBLE);
  for (let i = skillScroll; i < last; i++) {
    const n = SKILL_NODES[i];
    const y = SKILL_LIST_Y + (i - skillScroll) * SKILL_ROW_H;
    const rank = skills.rankOf(n.id);
    const sel = i === skillSel;
    const locked = !skills.prereqMet(n.id);
    ctx.fillStyle = sel ? '#1c1c2a' : '#121220';
    ctx.fillRect(x, y, rowW, SKILL_ROW_H - 4);
    if (sel) {
      ctx.strokeStyle = BRANCH_COLOR[n.branch];
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, rowW, SKILL_ROW_H - 4);
      ctx.lineWidth = 1;
    }
    ctx.fillStyle = BRANCH_COLOR[n.branch];
    ctx.fillRect(x + 8, y + 6, 9, 9);
    ctx.textAlign = 'left';
    ctx.fillStyle = locked ? '#5a5a66' : '#e8e8f0';
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.fillText(n.name, x + 24, y + 15);
    let dots = '';
    for (let d = 0; d < n.maxRank; d++) dots += d < rank ? '▰' : '▱';
    ctx.fillStyle = BRANCH_COLOR[n.branch];
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(dots, x + 190, y + 15);
    ctx.fillStyle = '#8a8a98';
    ctx.fillText(n.desc, x + 280, y + 15);
    ctx.textAlign = 'right';
    if (skills.isMaxed(n.id)) {
      ctx.fillStyle = '#6fcf57';
      ctx.fillText('MAX', x + rowW - 12, y + 15);
    } else if (locked) {
      ctx.fillStyle = '#7a5a3a';
      ctx.fillText('LOCKED', x + rowW - 12, y + 15);
    } else {
      ctx.fillStyle = skills.canBuy(n.id) ? '#ffd54a' : '#7a6a3a';
      ctx.fillText(`✸ ${skills.costOf(n.id)}`, x + rowW - 12, y + 15);
    }
  }
  // scroll hint
  if (SKILL_NODES.length > SKILL_VISIBLE) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#5a5a66';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`${skillSel + 1}/${SKILL_NODES.length}`, W - 12, H - 30);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7a7a8a';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('↑/↓ select   ·   ENTER learn   ·   ESC / K  leave   ·   Insight from battles & binds', W / 2, H - 14);
}

function buildBattleInfo() {
  const a = statsOf(roster.party[battleActive]);
  const w = statsOf(wild);
  const party: PartyPip[] = roster.party.map((m, i) => {
    const s = statsOf(m);
    const v = i === battleActive ? combat!.playerVigor : teamVigor[i];
    return { name: s.name, element: s.element, vigorFrac: s.vigor ? v / s.vigor : 0, active: i === battleActive, fainted: v <= 0 };
  });
  return {
    wraithName: a.name,
    wraithLevel: a.level,
    signatureName: a.signature?.name,
    enemyName: w.aberrant ? `Aberrant ${w.name}` : w.name,
    enemyLevel: w.level,
    enemyElement: w.element,
    enemyRarity: w.aberrant ? 'aberrant' : w.rarity,
    enemyRarityColor: w.aberrant ? '#ff7ad9' : RARITY_COLOR[w.rarity],
    enemyProfile: combat!.profileName,
    enemyHit: performance.now() - lastEnemyHit < 180,
    playerHit: performance.now() - lastPlayerHit < 180,
    party,
  };
}

function buildTrialInfo() {
  const ai = roster.activeIndex;
  const a = statsOf(roster.party[ai]);
  const party: PartyPip[] = roster.party.map((m, i) => {
    const s = statsOf(m);
    const v = i === ai ? combat!.playerVigor : s.vigor;
    return { name: s.name, element: s.element, vigorFrac: s.vigor ? v / s.vigor : 0, active: i === ai, fainted: i === ai ? combat!.playerVigor <= 0 : false };
  });
  return {
    wraithName: a.name,
    wraithLevel: a.level,
    signatureName: a.signature?.name,
    enemyName: trialKind === 'practice' ? 'THE METRONOME' : 'THE GAUNTLET',
    enemyLevel: 0,
    enemyElement: 'hollow' as const,
    enemyRarity: trialKind,
    enemyRarityColor: '#c77dff',
    enemyProfile: combat!.profileName,
    playerHit: performance.now() - lastPlayerHit < 180,
    party,
  };
}

function drawTrialOverlay(): void {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 15px ui-monospace, monospace';
  const title = trialKind === 'daily' ? 'DAILY WARD' : trialKind === 'practice' ? 'PRACTICE · SLOW KNELL (800ms) · ESC to leave' : 'TRIALS';
  const best = trialKind === 'daily' ? records.dailyBest : records.trialBest;
  const bestPart = trialKind === 'practice' ? '' : `  ·  Best ${best}`;
  ctx.fillText(`${title}  ·  Perfects ${combat!.perfects}  ·  Streak ${combat!.bestStreak}${bestPart}`, canvas.width / 2, 16);
}

/** Turn new combat floats (grade events) into juice. Cosmetic only. */
function pumpFx(c: Combat, now: number): void {
  const W = canvas.width;
  const nx = W - 120; // the NOW line
  const ny = 165;
  for (const f of c.floats) {
    if (f.id <= lastFloatSeen) continue;
    lastFloatSeen = f.id;
    switch (f.kind) {
      case 'perfect':
        fx.burst(nx, ny, '#ffd54a', 18, now);
        fx.flash('#ffd54a', 0.1, 110, now);
        fx.shake(3, 130, now);
        break;
      case 'clean':
        fx.burst(nx, ny, '#8be9fd', 8, now);
        break;
      case 'graze':
        fx.burst(nx, ny, '#ffa657', 8, now);
        fx.shake(2, 100, now);
        lastPlayerHit = now;
        break;
      case 'miss':
        fx.flash('#ff3344', 0.22, 170, now);
        fx.shake(9, 230, now);
        audio.hit();
        lastPlayerHit = now;
        break;
      case 'strike':
        fx.burst(W / 2, 57, '#ff7ad9', 14, now);
        fx.shake(4, 140, now);
        lastEnemyHit = now;
        break;
      default:
        fx.flash('#c77dff', 0.1, 140, now); // a curse landed on you
    }
  }
}

function drawBeat(b: Beat): void {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = 'rgba(6,6,10,0.82)';
  ctx.fillRect(0, 0, W, H);
  const bx = 90;
  const bw = W - 180;
  ctx.fillStyle = '#13121c';
  ctx.fillRect(bx, H / 2 - 90, bw, 180);
  ctx.strokeStyle = '#c77dff';
  ctx.strokeRect(bx, H / 2 - 90, bw, 180);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 20px ui-monospace, monospace';
  ctx.fillText(b.title, W / 2, H / 2 - 56);
  ctx.fillStyle = '#cfd2e0';
  ctx.font = '13px ui-monospace, monospace';
  wrapText(ctx, b.text, W / 2, H / 2 - 28, bw - 48, 19);
  ctx.fillStyle = '#7a7a8a';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('— press ENTER —', W / 2, H / 2 + 74);
}

// ---------- main loop ----------
function loop(): void {
  const now = performance.now();

  // Screenshake: translate the whole frame; particles ride along, flash sits on top.
  const [ox, oy] = fx.offset(now);
  if (ox !== 0 || oy !== 0) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.save();
  ctx.translate(Math.round(ox), Math.round(oy));

  if (scene === 'title') {
    drawTitle();
  } else if (scene === 'overworld' && overworld) {
    overworld.encounterLuck = skills.rareLuck() + sanctuary.lure();
    overworld.update(now, rawKeys);
    overworld.render(ctx, now);
    drawMotes(ctx, canvas.width, canvas.height, now, overworld.stutterActive(now) ? '#c77dff' : '#ff7a4a', 10);
    drawVignette(ctx, canvas.width, canvas.height);
    drawOverworldHud(overworld.stutterActive(now));
    if (overworld.pendingSanctuary) {
      overworld.pendingSanctuary = false;
      sanctSel = 0;
      scene = 'sanctuary';
      rawKeys.clear();
    } else if (overworld.pendingBoss) {
      overworld.pendingBoss = false;
      summonBoss(); // the Hollow Shrine — the Hunt's boss ladder
    } else if (overworld.pendingEncounter) {
      const m = overworld.pendingEncounter;
      overworld.pendingEncounter = null;
      startBattle(now, m);
    }
  } else if (scene === 'sanctuary') {
    drawSanctuary();
  } else if (scene === 'skilltree') {
    drawSkillTree();
  } else if (scene === 'battle' && combat) {
    const before = combat.perfects;
    combat.update(now);
    if (combat.perfects > before) audio.perfect();
    pumpFx(combat, now);
    tickAudio(combat.tickIndexAt(now), combat.phase === 'playing');

    // Forced swap on faint if a teammate is still standing.
    if (combat.playerVigor <= 0) {
      teamVigor[battleActive] = 0;
      const n = aliveInDirection(1);
      if (n >= 0) {
        swapTo(n, now, true);
        combat.phase = 'playing';
      }
    }

    render(ctx, combat, now, buildBattleInfo());

    if (combat.phase === 'won') {
      applyWinXp();
      if (currentBossId) {
        story.defeatBoss(currentBossId);
        const boss = HUNT_BOSSES.find((b) => b.id === currentBossId);
        if (boss) pendingBeats.push({ title: boss.name, text: boss.victory });
        persist();
      }
      startRite(now);
    } else if (combat.phase === 'lost') {
      promptReturn('YOU FELL — press  ENTER');
    }
  } else if (scene === 'trial' && combat) {
    const before = combat.perfects;
    combat.update(now);
    if (combat.perfects > before) audio.perfect();
    pumpFx(combat, now);
    tickAudio(combat.tickIndexAt(now), combat.phase === 'playing');
    render(ctx, combat, now, buildTrialInfo());
    drawTrialOverlay();
    if (combat.phase === 'lost') {
      endTrial();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd54a';
      ctx.font = 'bold 40px ui-monospace, monospace';
      ctx.fillText('GAUNTLET OVER', canvas.width / 2, canvas.height / 2 - 6);
      ctx.fillStyle = '#cfd2e0';
      ctx.font = '15px ui-monospace, monospace';
      const best = trialKind === 'daily' ? records.dailyBest : records.trialBest;
      ctx.fillText(`Perfects: ${combat.perfects}   ·   Best: ${best}`, canvas.width / 2, canvas.height / 2 + 26);
      ctx.fillText('Press  ENTER  to return', canvas.width / 2, canvas.height / 2 + 52);
    }
  } else if (scene === 'rite' && rite) {
    const before = rite.combat.perfects;
    rite.update(now);
    if (rite.combat.perfects > before) audio.perfect();
    pumpFx(rite.combat, now);
    tickAudio(rite.combat.tickIndexAt(now), !rite.finished);
    renderRite(ctx, rite, now, { wildName: statsOf(wild).name, wildElement: statsOf(wild).element });

    if (rite.finished && !riteResolved) {
      riteResolved = true;
      if (rite.bound) {
        const isNew = roster.addCatch(wild);
        sanctuary.addBeacon(12 * sanctuary.beaconMult() * skills.beaconMult()); // Beacon for binding
        skills.addInsight(2); // Insight for binding
        tellOnce('firstbind', BEATS.firstbind);
        const rar = statsOf(wild).rarity;
        if (rar === 'rare' || rar === 'revenant' || rar === 'mythic') tellOnce('firstrare', BEATS.firstrare);
        persist();
        if (isNew) levelMsg = (levelMsg ? levelMsg + '  ·  ' : '') + 'New species for the Dex!';
      }
    }
    if (rite.finished && levelMsg) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8be9fd';
      ctx.font = '14px ui-monospace, monospace';
      ctx.fillText(levelMsg, canvas.width / 2, canvas.height / 2 + 60);
    }
  }

  fx.drawParticles(ctx, now);
  ctx.restore();
  fx.drawFlash(ctx, now, canvas.width, canvas.height);

  if (beatQueue.length > 0) drawBeat(beatQueue[0]); // story beat overlays everything

  requestAnimationFrame(loop);
}

function tickAudio(t: number, playing: boolean): void {
  if (t !== lastTick && playing) {
    lastTick = t;
    audio.knell();
  }
}

function promptReturn(msg: string): void {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#cfd2e0';
  ctx.font = '14px ui-monospace, monospace';
  ctx.fillText(msg, canvas.width / 2, canvas.height / 2 + 84);
}

requestAnimationFrame(loop);
