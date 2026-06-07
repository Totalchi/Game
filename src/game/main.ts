import '../style.css';
import { Combat, type PlayerStats } from '../core/combat';
import { CFG } from '../core/config';
import { BindingRite } from '../core/binding';
import { ELEMENTS } from '../core/types';
import { render, renderRite, type PartyPip } from './render';
import { Audio } from './audio';
import { SPECIES, STARTER_IDS, RARITY_COLOR, type Rarity } from '../data/species';
import { makeMon, statsOf, gainXp, type Mon } from '../core/mon';
import { ELEMENT_COLOR } from './colors';
import { Overworld } from './overworld';
import { loadRoster, saveRoster } from './save';

const KEY_TO_INDEX: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 };
const MOVE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd']);
const STARTERS = STARTER_IDS.map((id) => SPECIES[id]);
const SWAP_AETHER_COST = 15;

const app = document.getElementById('app')!;
const canvas = document.createElement('canvas');
canvas.width = 900;
canvas.height = 620;
app.appendChild(canvas);
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;

const audio = new Audio();

type Scene = 'title' | 'overworld' | 'battle' | 'rite';
let scene: Scene = 'title';
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

let roster = loadRoster();
if (!roster.isEmpty()) {
  overworld = new Overworld();
  scene = 'overworld';
}

// ---------- stat helpers ----------
function playerStats(mon: Mon): Partial<PlayerStats> {
  const s = statsOf(mon);
  const sig = s.signature;
  return {
    vigor: s.vigor,
    aetherMax: s.aether,
    aetherRegenPerMs: CFG.aetherRegenPerMs * (sig?.aetherRegenMult ?? 1),
    strikePower: s.power * (sig?.strikePowerMult ?? 1),
    bonusResolveOnPerfect: sig?.bonusResolveOnPerfect ?? 0,
  };
}

function enemyStats(mon: Mon): { vigor: number; powerMult: number } {
  const s = statsOf(mon);
  let mult = 1 + (s.level - 5) * 0.03;
  if (s.rarity === 'rare') mult += 0.1;
  else if (s.rarity === 'revenant') mult += 0.2;
  else if (s.rarity === 'mythic') mult += 0.3;
  // Enemy Vigor is a fraction of its stat so battles stay snappy.
  return { vigor: Math.round(s.vigor * 1.8), powerMult: Math.max(0.6, mult) };
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
  battleActive = roster.activeIndex;
  teamVigor = roster.party.map((m) => statsOf(m).vigor); // full heal each encounter (demo)
  combat = new Combat(now, {
    playerElement: aStats.element,
    seed: Math.floor(now) % 9999,
    autoDirector: true,
    stats: playerStats(active),
    enemy: enemyStats(wildMon),
  });
  combat.playerVigor = teamVigor[battleActive];
  heldWards.clear();
  lastTick = -1;
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
  if (!forced) combat.aether = Math.max(0, combat.aether - SWAP_AETHER_COST);
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
  const gain = 8 + statsOf(wild).level * 3;
  const res = gainXp(aMon, gain);
  if (res.ascended) levelMsg = `${res.ascended.fromName} ascended into ${res.ascended.toName}!`;
  else if (res.leveledTo.length) levelMsg = `${statsOf(aMon).name} reached Lv${aMon.level}!`;
  saveRoster(roster);
}

function startRite(now: number): void {
  const s = statsOf(wild);
  const p = riteFor(s.rarity);
  rite = new BindingRite(now, { element: s.element, seed: Math.floor(now) % 9999, count: p.count, threshold: p.threshold });
  riteResolved = false;
  heldWards.clear();
  lastTick = -1;
  scene = 'rite';
}

function returnToOverworld(): void {
  combat = null;
  rite = null;
  scene = 'overworld';
  rawKeys.clear();
}

// ---------- input ----------
window.addEventListener('keydown', (e) => {
  if (scene === 'title') {
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      roster.addCatch(makeMon(STARTERS[Number(e.key) - 1].id, 5));
      saveRoster(roster);
      overworld = new Overworld();
      scene = 'overworld';
    }
    return;
  }

  if (scene === 'overworld') {
    if (MOVE_KEYS.has(e.key)) rawKeys.add(e.key);
    else if (e.key === 'Tab') {
      e.preventDefault();
      roster.cycle();
      saveRoster(roster);
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
  if (scene === 'battle' && combat) combat.releaseWard(el, now);
  else if (scene === 'rite' && rite) rite.releaseWard(el, now);
  const fallbackKey = [...heldWards].pop();
  if (fallbackKey) {
    const fb = ELEMENTS[KEY_TO_INDEX[fallbackKey]];
    if (scene === 'battle' && combat) combat.raiseWard(fb, now);
    else if (scene === 'rite' && rite) rite.raiseWard(fb, now);
  }
});

function raiseWardKey(e: KeyboardEvent): void {
  const idx = KEY_TO_INDEX[e.key];
  if (idx === undefined || e.repeat) return;
  const el = ELEMENTS[idx];
  heldWards.add(e.key);
  const now = performance.now();
  if (scene === 'battle' && combat) combat.raiseWard(el, now);
  else if (scene === 'rite' && rite) rite.raiseWard(el, now);
  audio.flick();
}

// ---------- title ----------
function drawTitle(): void {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#0c0b10';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 44px ui-monospace, monospace';
  ctx.fillText('WARDBOUND', W / 2, 92);
  ctx.fillStyle = '#9a9aa8';
  ctx.font = '15px ui-monospace, monospace';
  ctx.fillText('Flick the tick. Bind the beast.', W / 2, 122);
  ctx.fillStyle = '#cfd2e0';
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText('Explore (arrows/WASD) · Tall grass = wild Wraiths · Tab/Q/E switch Wraith', W / 2, 160);
  ctx.fillText('Battle: Ward (1–6) on the beat · SPACE Strike · weaken it, then bind it', W / 2, 182);
  ctx.fillStyle = '#ffd54a';
  ctx.fillText('Choose your first Wraith — press 1, 2 or 3', W / 2, 228);

  STARTERS.forEach((s, i) => {
    const x = W / 2 - 300 + i * 200;
    const y = 264;
    ctx.fillStyle = '#15151f';
    ctx.fillRect(x, y, 180, 160);
    ctx.strokeStyle = ELEMENT_COLOR[s.element];
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 180, 160);
    ctx.lineWidth = 1;
    ctx.fillStyle = ELEMENT_COLOR[s.element];
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText(`${i + 1}. ${s.name}`, x + 90, y + 32);
    ctx.fillStyle = '#cfd2e0';
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(s.element.toUpperCase(), x + 90, y + 54);
    wrapText(ctx, s.blurb, x + 90, y + 80, 162, 16);
  });
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

function drawOverworldHud(): void {
  const W = canvas.width;
  ctx.fillStyle = 'rgba(8,8,12,0.72)';
  ctx.fillRect(0, 0, W, 30);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.fillText('The Cinderwaste', 12, 20);

  ctx.font = '12px ui-monospace, monospace';
  let x = 190;
  for (const p of roster.partyLabels()) {
    ctx.fillStyle = p.active ? ELEMENT_COLOR[p.element] : '#6a6a78';
    const label = p.active ? `▸${p.name}` : p.name;
    ctx.fillText(label, x, 20);
    x += ctx.measureText(label).width + 14;
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#7a7a8a';
  ctx.fillText(`Dex ${roster.speciesCount()} · Bound ${roster.totalBound()} · Tab switch`, W - 12, 20);
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
    party,
  };
}

// ---------- main loop ----------
function loop(): void {
  const now = performance.now();

  if (scene === 'title') {
    drawTitle();
  } else if (scene === 'overworld' && overworld) {
    overworld.update(now, rawKeys);
    overworld.render(ctx, now);
    drawOverworldHud();
    if (overworld.pendingEncounter) {
      const m = overworld.pendingEncounter;
      overworld.pendingEncounter = null;
      startBattle(now, m);
    }
  } else if (scene === 'battle' && combat) {
    const before = combat.perfects;
    combat.update(now);
    if (combat.perfects > before) audio.perfect();
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
      startRite(now);
    } else if (combat.phase === 'lost') {
      promptReturn('YOU FELL — press  ENTER');
    }
  } else if (scene === 'rite' && rite) {
    const before = rite.combat.perfects;
    rite.update(now);
    if (rite.combat.perfects > before) audio.perfect();
    tickAudio(rite.combat.tickIndexAt(now), !rite.finished);
    renderRite(ctx, rite, now, { wildName: statsOf(wild).name, wildElement: statsOf(wild).element });

    if (rite.finished && !riteResolved) {
      riteResolved = true;
      if (rite.bound) {
        const isNew = roster.addCatch(wild);
        saveRoster(roster);
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
