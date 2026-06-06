import '../style.css';
import { Combat } from '../core/combat';
import { BindingRite } from '../core/binding';
import { ELEMENTS, type Element } from '../core/types';
import { render, renderRite } from './render';
import { Audio } from './audio';
import { STARTERS } from '../data/wraiths';
import { ELEMENT_COLOR } from './colors';
import { Overworld } from './overworld';
import { Roster } from '../core/roster';
import { loadRoster, saveRoster } from './save';

const KEY_TO_INDEX: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 };
const MOVE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd']);

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
let wild: { name: string; element: Element } = { name: 'Ashling', element: 'ember' };
let lastTick = -1;

const rawKeys = new Set<string>();
const heldWards = new Set<Element>();

let roster = loadRoster();
if (!roster.isEmpty()) {
  overworld = new Overworld();
  scene = 'overworld';
}

const WILD_NAMES: Record<Element, string> = {
  ember: 'Ashling',
  tide: 'Drippet',
  storm: 'Sprite',
  stone: 'Cairnling',
  bloom: 'Sporeling',
  frost: 'Rimeling',
  hollow: 'Hollow Wisp',
};

function startBattle(now: number, element: Element): void {
  wild = { name: WILD_NAMES[element], element };
  combat = new Combat(now, { playerElement: roster.active().element, seed: Math.floor(now) % 9999, autoDirector: true });
  heldWards.clear();
  lastTick = -1;
  scene = 'battle';
}

function startRite(now: number): void {
  rite = new BindingRite(now, { element: wild.element, seed: Math.floor(now) % 9999, count: 5 });
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
      const s = STARTERS[Number(e.key) - 1];
      roster.add(s.name, s.element);
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
  heldWards.delete(el);
  const now = performance.now();
  if (scene === 'battle' && combat) combat.releaseWard(el, now);
  else if (scene === 'rite' && rite) rite.releaseWard(el, now);
  const fallback = [...heldWards].pop();
  if (fallback) {
    if (scene === 'battle' && combat) combat.raiseWard(fallback, now);
    else if (scene === 'rite' && rite) rite.raiseWard(fallback, now);
  }
});

function raiseWardKey(e: KeyboardEvent): void {
  const idx = KEY_TO_INDEX[e.key];
  if (idx === undefined || e.repeat) return;
  const el = ELEMENTS[idx];
  heldWards.add(el);
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
  ctx.fillText('WARDBOUND', W / 2, 96);
  ctx.fillStyle = '#9a9aa8';
  ctx.font = '15px ui-monospace, monospace';
  ctx.fillText('Flick the tick. Bind the beast.', W / 2, 126);
  ctx.fillStyle = '#cfd2e0';
  ctx.font = '14px ui-monospace, monospace';
  ctx.fillText('Explore (arrows/WASD). Tall grass hides wild Wraiths. Tab switches Wraith.', W / 2, 166);
  ctx.fillText('Battle: raise the matching Ward (1–6) on the beat · SPACE = Strike · then bind it.', W / 2, 188);
  ctx.fillStyle = '#ffd54a';
  ctx.fillText('Choose your first Wraith — press 1, 2 or 3', W / 2, 234);

  STARTERS.forEach((s, i) => {
    const x = W / 2 - 300 + i * 200;
    const y = 270;
    ctx.fillStyle = '#15151f';
    ctx.fillRect(x, y, 180, 150);
    ctx.strokeStyle = ELEMENT_COLOR[s.element];
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 180, 150);
    ctx.lineWidth = 1;
    ctx.fillStyle = ELEMENT_COLOR[s.element];
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText(`${i + 1}. ${s.name}`, x + 90, y + 34);
    ctx.fillStyle = '#cfd2e0';
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(s.element.toUpperCase(), x + 90, y + 56);
    wrapText(ctx, s.blurb, x + 90, y + 84, 160, 16);
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

function drawOverworldHud(r: Roster): void {
  const W = canvas.width;
  ctx.fillStyle = 'rgba(8,8,12,0.72)';
  ctx.fillRect(0, 0, W, 30);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.fillText('The Cinderwaste', 12, 20);

  // Party with the active Wraith highlighted.
  ctx.font = '12px ui-monospace, monospace';
  let x = 190;
  const active = r.active();
  for (const e of r.entries()) {
    const isActive = e.name === active.name;
    ctx.fillStyle = isActive ? ELEMENT_COLOR[e.element] : '#6a6a78';
    const label = isActive ? `▸${e.name}` : e.name;
    ctx.fillText(label, x, 20);
    x += ctx.measureText(label).width + 16;
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#7a7a8a';
  ctx.fillText(`Bound: ${r.totalBound()} (${r.speciesCount()} species) · Tab: switch`, W - 12, 20);
}

// ---------- main loop ----------
function loop(): void {
  const now = performance.now();

  if (scene === 'title') {
    drawTitle();
  } else if (scene === 'overworld' && overworld) {
    overworld.update(now, rawKeys);
    overworld.render(ctx, now);
    drawOverworldHud(roster);
    if (overworld.pendingEncounter) {
      const el = overworld.pendingEncounter;
      overworld.pendingEncounter = null;
      startBattle(now, el);
    }
  } else if (scene === 'battle' && combat) {
    const before = combat.perfects;
    combat.update(now);
    if (combat.perfects > before) audio.perfect();
    tickAudio(combat.tickIndexAt(now), combat.phase === 'playing');
    render(ctx, combat, now, { wraithName: roster.active().name, enemyName: wild.name, enemyElement: wild.element });
    if (combat.phase === 'won') {
      startRite(now); // weakened — now the Binding Rite begins
    } else if (combat.phase === 'lost') {
      promptReturn();
    }
  } else if (scene === 'rite' && rite) {
    const before = rite.combat.perfects;
    rite.update(now);
    if (rite.combat.perfects > before) audio.perfect();
    tickAudio(rite.combat.tickIndexAt(now), !rite.finished);
    renderRite(ctx, rite, now, { wildName: wild.name, wildElement: wild.element });
    if (rite.finished && !riteResolved) {
      riteResolved = true;
      if (rite.bound) {
        roster.add(wild.name, wild.element);
        saveRoster(roster);
      }
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

function promptReturn(): void {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#cfd2e0';
  ctx.font = '14px ui-monospace, monospace';
  ctx.fillText('Press  ENTER  to return to the dusk', canvas.width / 2, canvas.height / 2 + 84);
}

requestAnimationFrame(loop);
