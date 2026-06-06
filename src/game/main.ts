import '../style.css';
import { Combat } from '../core/combat';
import { ELEMENTS, type Element } from '../core/types';
import { render } from './render';
import { Audio } from './audio';
import { STARTERS, type WraithDef } from '../data/wraiths';
import { ELEMENT_COLOR } from './colors';
import { Overworld } from './overworld';

const KEY_TO_INDEX: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 };
const MOVE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd']);

const app = document.getElementById('app')!;
const canvas = document.createElement('canvas');
canvas.width = 900;
canvas.height = 620;
app.appendChild(canvas);
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false; // crisp pixels

const audio = new Audio();

type Scene = 'title' | 'overworld' | 'battle';
let scene: Scene = 'title';
let chosen: WraithDef | null = null;
let overworld: Overworld | null = null;
let combat: Combat | null = null;
let wild: { name: string; element: Element } = { name: 'Ashling', element: 'ember' };
let lastTick = -1;

const rawKeys = new Set<string>(); // overworld movement
const heldWards = new Set<Element>(); // battle Wards

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
  combat = new Combat(now, { playerElement: chosen!.element, seed: Math.floor(now) % 9999, autoDirector: true });
  heldWards.clear();
  lastTick = -1;
  scene = 'battle';
}

function returnToOverworld(): void {
  combat = null;
  scene = 'overworld';
  rawKeys.clear();
}

// ---------- input ----------
window.addEventListener('keydown', (e) => {
  if (scene === 'title') {
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      chosen = STARTERS[Number(e.key) - 1];
      overworld = new Overworld();
      scene = 'overworld';
    }
    return;
  }

  if (scene === 'overworld') {
    if (MOVE_KEYS.has(e.key)) rawKeys.add(e.key);
    return;
  }

  // battle
  if (!combat) return;
  if (combat.phase !== 'playing') {
    if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') returnToOverworld();
    return;
  }
  if (e.key === ' ') {
    e.preventDefault();
    combat.strike(performance.now());
    return;
  }
  const idx = KEY_TO_INDEX[e.key];
  if (idx !== undefined && !e.repeat) {
    const el = ELEMENTS[idx];
    heldWards.add(el);
    combat.raiseWard(el, performance.now());
    audio.flick();
  }
});

window.addEventListener('keyup', (e) => {
  rawKeys.delete(e.key);
  if (scene !== 'battle' || !combat) return;
  const idx = KEY_TO_INDEX[e.key];
  if (idx !== undefined) {
    const el = ELEMENTS[idx];
    heldWards.delete(el);
    combat.releaseWard(el, performance.now());
    const fallback = [...heldWards].pop();
    if (fallback) combat.raiseWard(fallback, performance.now());
  }
});

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
  ctx.fillText('Explore the dusk (arrows/WASD). Tall grass hides wild Wraiths.', W / 2, 166);
  ctx.fillText('In battle: raise the matching Ward (1–6) on the beat. SPACE = Strike.', W / 2, 188);
  ctx.fillStyle = '#ffd54a';
  ctx.fillText('Choose your Wraith — press 1, 2 or 3', W / 2, 234);

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

function drawOverworldHud(): void {
  const W = canvas.width;
  ctx.fillStyle = 'rgba(8,8,12,0.7)';
  ctx.fillRect(0, 0, W, 30);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.fillText('The Cinderwaste', 12, 20);
  ctx.fillStyle = '#cfd2e0';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`Wraith: ${chosen!.name}`, 200, 20);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#7a7a8a';
  ctx.fillText('Arrows/WASD · find a wild Wraith in the tall grass', W - 12, 20);
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
      const el = overworld.pendingEncounter;
      overworld.pendingEncounter = null;
      startBattle(now, el);
    }
  } else if (scene === 'battle' && combat) {
    const before = combat.perfects;
    combat.update(now);
    if (combat.perfects > before) audio.perfect();
    const t = combat.tickIndexAt(now);
    if (t !== lastTick && combat.phase === 'playing') {
      lastTick = t;
      audio.knell();
    }
    render(ctx, combat, now, { wraithName: chosen!.name, enemyName: wild.name, enemyElement: wild.element });
    if (combat.phase !== 'playing') {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#cfd2e0';
      ctx.font = '14px ui-monospace, monospace';
      ctx.fillText('Press  ENTER  to return to the dusk', canvas.width / 2, canvas.height / 2 + 84);
    }
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
