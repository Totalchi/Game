import '../style.css';
import { Combat } from '../core/combat';
import { CFG } from '../core/config';
import { ELEMENTS, type Element } from '../core/types';
import { render } from './render';
import { Audio } from './audio';
import { STARTERS, type WraithDef } from '../data/wraiths';
import { ELEMENT_COLOR } from './colors';

const KEY_TO_INDEX: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 };

const app = document.getElementById('app')!;
const canvas = document.createElement('canvas');
canvas.width = 900;
canvas.height = 620;
app.appendChild(canvas);
const ctx = canvas.getContext('2d')!;

const audio = new Audio();

let combat: Combat | null = null;
let chosen: WraithDef | null = null;
let lastTick = -1;
const held = new Set<Element>();

function startFight(wraith: WraithDef): void {
  chosen = wraith;
  held.clear();
  combat = new Combat(performance.now(), { playerElement: wraith.element, seed: 7, autoDirector: true });
  lastTick = -1;
}

function drawStartScreen(): void {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#0c0b10';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 44px ui-monospace, monospace';
  ctx.fillText('WARDBOUND', W / 2, 110);
  ctx.fillStyle = '#9a9aa8';
  ctx.font = '15px ui-monospace, monospace';
  ctx.fillText('Flick the tick. Bind the beast.', W / 2, 140);
  ctx.fillStyle = '#cfd2e0';
  ctx.font = '14px ui-monospace, monospace';
  ctx.fillText('Raise the matching Ward (keys 1–6) on the beat an attack lands.', W / 2, 180);
  ctx.fillText('Tap = a cheap Perfect.  Holding drains Aether.  SPACE = Strike.', W / 2, 202);
  ctx.fillStyle = '#ffd54a';
  ctx.fillText('Choose your Wraith — press 1, 2 or 3', W / 2, 250);

  STARTERS.forEach((s, i) => {
    const x = W / 2 - 300 + i * 200;
    const y = 290;
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

window.addEventListener('keydown', (e) => {
  if (!combat) {
    if (e.key === '1') startFight(STARTERS[0]);
    else if (e.key === '2') startFight(STARTERS[1]);
    else if (e.key === '3') startFight(STARTERS[2]);
    return;
  }
  if (e.key === 'r' || e.key === 'R') {
    if (chosen && combat.phase !== 'playing') startFight(chosen);
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
    held.add(el);
    combat.raiseWard(el, performance.now());
    audio.flick();
  }
});

window.addEventListener('keyup', (e) => {
  if (!combat) return;
  const idx = KEY_TO_INDEX[e.key];
  if (idx !== undefined) {
    const el = ELEMENTS[idx];
    held.delete(el);
    combat.releaseWard(el, performance.now());
    // Fall back to another still-held key if any (last wins).
    const fallback = [...held].pop();
    if (fallback) combat.raiseWard(fallback, performance.now());
  }
});

function loop(): void {
  const now = performance.now();
  if (!combat) {
    drawStartScreen();
  } else {
    const before = combat.perfects;
    combat.update(now);
    if (combat.perfects > before) audio.perfect();

    const t = combat.tickIndexAt(now);
    if (t !== lastTick && combat.phase === 'playing') {
      lastTick = t;
      audio.knell();
    }
    render(ctx, combat, now, { wraithName: chosen!.name });
  }
  requestAnimationFrame(loop);
}

void CFG; // referenced for tuning visibility
requestAnimationFrame(loop);
