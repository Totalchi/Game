import { Combat } from '../core/combat';
import type { BindingRite } from '../core/binding';
import { CFG } from '../core/config';
import { ELEMENTS, type Element } from '../core/types';
import { ELEMENT_COLOR, ELEMENT_GLYPH, GRADE_COLOR } from './colors';

const LANE_LEAD_MS = 3 * CFG.tickMs; // how far ahead the lane shows incoming attacks

export interface PartyPip {
  name: string;
  element: Element;
  vigorFrac: number;
  active: boolean;
  fainted: boolean;
}

export interface RenderInfo {
  wraithName: string;
  wraithLevel: number;
  signatureName?: string;
  enemyName: string;
  enemyLevel: number;
  enemyElement: Element;
  enemyRarity?: string;
  enemyRarityColor?: string;
  party: PartyPip[];
}

export interface RiteInfo {
  wildName: string;
  wildElement: Element;
}

export function render(ctx: CanvasRenderingContext2D, c: Combat, now: number, info: RenderInfo): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  // Background (the Long Dusk).
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#14131a');
  bg.addColorStop(1, '#0c0b10');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawEnemy(ctx, c, info, W);
  drawCurses(ctx, c, now);
  drawLane(ctx, c, now, W, H);
  drawKnell(ctx, c, W, H);
  drawBars(ctx, c, W, H);
  drawWards(ctx, c, W, H);
  drawPlayer(ctx, c, info, W, H);
  drawFloats(ctx, c, now, W, H);

  if (c.phase !== 'playing') drawEnd(ctx, c, W, H);
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frac: number, color: string, label: string): void {
  ctx.fillStyle = '#222230';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = '#3a3a4a';
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#e8e8f0';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y - 4);
}

function drawEnemy(ctx: CanvasRenderingContext2D, c: Combat, info: RenderInfo, W: number): void {
  ctx.fillStyle = ELEMENT_COLOR[info.enemyElement];
  ctx.font = 'bold 20px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${info.enemyName}  Lv${info.enemyLevel}  ${ELEMENT_GLYPH[info.enemyElement]} ${info.enemyElement}`, 24, 36);
  if (info.enemyRarity && info.enemyRarity !== 'common') {
    ctx.fillStyle = info.enemyRarityColor ?? '#fff';
    ctx.font = 'bold 13px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`✦ ${info.enemyRarity.toUpperCase()}`, W - 24, 36);
  }
  bar(ctx, 24, 50, W - 48, 14, c.enemyVigor / c.enemyVigorMax, '#ff5566', 'WILD WRAITH VIGOR');
}

function drawCurses(ctx: CanvasRenderingContext2D, c: Combat, now: number): void {
  const curses = c.activeCurses(now);
  if (curses.length === 0) return;
  ctx.textAlign = 'left';
  ctx.font = 'bold 11px ui-monospace, monospace';
  let x = 24;
  const y = 92;
  ctx.fillStyle = '#ff6b6b';
  ctx.fillText('CURSED:', x, y);
  x += 62;
  for (const cu of curses) {
    const w = ctx.measureText(cu.short).width + 12;
    ctx.fillStyle = cu.color;
    ctx.fillRect(x, y - 11, w, 15);
    ctx.fillStyle = '#0c0b10';
    ctx.fillText(cu.short, x + 6, y + 1);
    x += w + 6;
  }
}

function drawLane(ctx: CanvasRenderingContext2D, c: Combat, now: number, W: number, H: number): void {
  const laneY = 120;
  const laneH = 90;
  const nowX = W - 120; // the NOW line, where attacks land
  const left = 40;
  const lead = c.hasCurse('static', now) ? 2 * CFG.tickMs : LANE_LEAD_MS; // Static: less lead time

  // Lane backdrop + NOW line.
  ctx.fillStyle = '#101019';
  ctx.fillRect(left, laneY, W - left - 24, laneH);
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(nowX, laneY - 6);
  ctx.lineTo(nowX, laneY + laneH + 6);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#8a8a9a';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NOW', nowX, laneY - 10);

  for (const t of c.telegraphs) {
    const landing = c.timeOfTick(t.landingTick);
    const remaining = landing - now;
    if (remaining > lead || remaining < -200) continue;
    const frac = remaining / lead; // 1 = far, 0 = landing
    const x = nowX - (nowX - left) * (1 - frac);
    const shown: Element = t.feintFrom && !t.flipped ? t.feintFrom : t.element;
    const col = ELEMENT_COLOR[shown];

    const cy = laneY + laneH / 2;
    const r = 22;
    ctx.fillStyle = col;
    ctx.globalAlpha = t.resolved ? 0.25 : 1;
    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0c0b10';
    ctx.font = 'bold 22px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ELEMENT_GLYPH[shown], x, cy + 1);
    ctx.textBaseline = 'alphabetic';

    if (t.feintFrom && !t.flipped) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px ui-monospace, monospace';
      ctx.fillText('?feint', x, cy + r + 12);
    }
  }
  void H;
}

function drawKnell(ctx: CanvasRenderingContext2D, c: Combat, W: number, H: number): void {
  const p = c.tickProgress();
  const pulse = 1 - p; // bright at the start of each beat
  const cx = W / 2;
  const cy = H / 2 + 10;
  const r = 26 + pulse * 14;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 90, 60, ${0.18 + pulse * 0.5})`;
  ctx.fill();
  ctx.strokeStyle = '#ff7a4a';
  ctx.stroke();
  ctx.fillStyle = '#9a9aa8';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('THE KNELL', cx, cy + r + 18);
}

function drawBars(ctx: CanvasRenderingContext2D, c: Combat, W: number, H: number): void {
  const y = H - 132;
  bar(ctx, 24, y, (W - 72) / 2, 16, c.aether / c.aetherMax, '#48c0ff', `AETHER ${Math.round(c.aether)}`);
  const rx = 24 + (W - 72) / 2 + 24;
  const ready = c.resolve >= CFG.strikeCost;
  bar(ctx, rx, y, (W - 72) / 2, 16, c.resolve / CFG.resolveMax, ready ? '#ff7ad9' : '#9a5bb0', `RESOLVE ${Math.round(c.resolve)}${ready ? '  [SPACE = STRIKE]' : ''}`);
}

function drawWards(ctx: CanvasRenderingContext2D, c: Combat, W: number, H: number): void {
  const y = H - 96;
  const n = ELEMENTS.length;
  const gap = 10;
  const bw = (W - 48 - gap * (n - 1)) / n;
  ELEMENTS.forEach((el, i) => {
    const x = 24 + i * (bw + gap);
    const up = c.activeElement === el;
    ctx.fillStyle = up ? ELEMENT_COLOR[el] : '#1b1b27';
    ctx.fillRect(x, y, bw, 54);
    ctx.strokeStyle = ELEMENT_COLOR[el];
    ctx.lineWidth = up ? 3 : 1;
    ctx.strokeRect(x, y, bw, 54);
    ctx.lineWidth = 1;
    ctx.fillStyle = up ? '#0c0b10' : ELEMENT_COLOR[el];
    ctx.font = 'bold 20px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ELEMENT_GLYPH[el], x + bw / 2, y + 26);
    ctx.fillStyle = up ? '#0c0b10' : '#9a9aa8';
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`${i + 1} ${el}`, x + bw / 2, y + 44);
  });
}

function drawPlayer(ctx: CanvasRenderingContext2D, c: Combat, info: RenderInfo, W: number, H: number): void {
  // Party pips (for mid-battle swapping).
  if (info.party.length > 1) {
    ctx.textAlign = 'left';
    let x = 24;
    const py = H - 48;
    for (const p of info.party) {
      const w = 90;
      ctx.fillStyle = p.fainted ? '#2a2a32' : p.active ? ELEMENT_COLOR[p.element] : '#1b1b27';
      ctx.fillRect(x, py, w, 14);
      ctx.fillStyle = '#0c0b10';
      if (!p.fainted && !p.active) {
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(x, py, w * p.vigorFrac, 14);
      }
      ctx.strokeStyle = ELEMENT_COLOR[p.element];
      ctx.strokeRect(x, py, w, 14);
      ctx.fillStyle = p.active ? '#0c0b10' : p.fainted ? '#55555f' : '#cfd2e0';
      ctx.font = '9px ui-monospace, monospace';
      ctx.fillText(p.name.slice(0, 11), x + 3, py + 10);
      x += w + 6;
    }
    ctx.fillStyle = '#7a7a8a';
    ctx.fillText('Q/E swap', x + 2, py + 10);
  }

  const sig = info.signatureName ? `  ·  ${info.signatureName}` : '';
  bar(ctx, 24, H - 28, W - 48, 14, c.playerVigor / c.playerVigorMax, '#5fd35f', `${info.wraithName} Lv${info.wraithLevel}  VIGOR ${Math.round(c.playerVigor)}${sig}   ·   Perfects ${c.perfects} · Streak ${c.bestStreak}`);
}

function drawFloats(ctx: CanvasRenderingContext2D, c: Combat, now: number, W: number, H: number): void {
  ctx.textAlign = 'center';
  for (const f of c.floats) {
    const age = (now - f.bornAt) / 900;
    ctx.globalAlpha = Math.max(0, 1 - age);
    ctx.fillStyle = GRADE_COLOR[f.kind] ?? '#fff';
    ctx.font = `bold ${f.kind === 'perfect' ? 34 : 24}px ui-monospace, monospace`;
    ctx.fillText(f.text, W / 2, H / 2 - 40 - age * 30);
  }
  ctx.globalAlpha = 1;
}

function drawEnd(ctx: CanvasRenderingContext2D, c: Combat, W: number, H: number): void {
  ctx.fillStyle = 'rgba(8,8,12,0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = c.phase === 'won' ? '#ffd54a' : '#ff6b6b';
  ctx.font = 'bold 48px ui-monospace, monospace';
  ctx.fillText(c.phase === 'won' ? 'WRAITH BOUND' : 'YOU FELL', W / 2, H / 2 - 10);
  ctx.fillStyle = '#cfd2e0';
  ctx.font = '16px ui-monospace, monospace';
  ctx.fillText(`Perfects: ${c.perfects}   ·   Best streak: ${c.bestStreak}`, W / 2, H / 2 + 26);
}

export function renderRite(ctx: CanvasRenderingContext2D, rite: BindingRite, now: number, info: RiteInfo): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#161320');
  bg.addColorStop(1, '#0c0b10');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 22px ui-monospace, monospace';
  ctx.fillText('BINDING RITE', W / 2, 32);
  ctx.fillStyle = ELEMENT_COLOR[info.wildElement];
  ctx.font = '14px ui-monospace, monospace';
  ctx.fillText(`Ward the ${info.wildName}'s strikes to bind it  —  strike ${rite.progressCount()} / ${rite.total}`, W / 2, 54);

  drawLane(ctx, rite.combat, now, W, H);
  drawKnell(ctx, rite.combat, W, H);

  // Bind meter (the star of this screen)
  const mx = 150;
  const mw = W - 300;
  const my = H - 178;
  bar(ctx, mx, my, mw, 24, rite.bindMeter / 100, '#ffd54a', `BIND  ${Math.round(rite.bindMeter)} / 100`);
  const thx = mx + mw * (rite.threshold / 100);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(thx - 1, my - 6, 2, 36);
  ctx.fillStyle = '#9a9aa8';
  ctx.font = '10px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`bind at ${rite.threshold}`, thx, my - 10);

  bar(ctx, 24, H - 132, W - 48, 16, rite.combat.aether / rite.combat.aetherMax, '#48c0ff', `AETHER ${Math.round(rite.combat.aether)}`);
  drawWards(ctx, rite.combat, W, H);
  drawFloats(ctx, rite.combat, now, W, H);

  if (rite.finished) {
    ctx.fillStyle = 'rgba(8,8,12,0.8)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = rite.bound ? '#ffd54a' : '#ff6b6b';
    ctx.font = 'bold 46px ui-monospace, monospace';
    ctx.fillText(rite.bound ? 'WRAITH BOUND!' : 'IT SLIPPED AWAY', W / 2, H / 2 - 6);
    ctx.fillStyle = '#cfd2e0';
    ctx.font = '15px ui-monospace, monospace';
    ctx.fillText('Press  ENTER  to return to the dusk', W / 2, H / 2 + 30);
  }
}
