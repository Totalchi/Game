import { Combat } from '../core/combat';
import type { BindingRite } from '../core/binding';
import { CFG } from '../core/config';
import { ELEMENTS, type Element } from '../core/types';
import { ELEMENT_COLOR, ELEMENT_GLYPH, GRADE_COLOR } from './colors';
import { drawWraith } from './sprites';

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
  enemyProfile?: string;
  enemyHit?: boolean;
  playerHit?: boolean;
  party: PartyPip[];
}

export interface RiteInfo {
  wildName: string;
  wildElement: Element;
}

// ---- atmosphere helpers (cached where possible; cosmetic only) ----
let vignetteCache: HTMLCanvasElement | null = null;
export function drawVignette(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  if (!vignetteCache || vignetteCache.width !== W || vignetteCache.height !== H) {
    vignetteCache = document.createElement('canvas');
    vignetteCache.width = W;
    vignetteCache.height = H;
    const vctx = vignetteCache.getContext('2d')!;
    const g = vctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.42)');
    vctx.fillStyle = g;
    vctx.fillRect(0, 0, W, H);
  }
  ctx.drawImage(vignetteCache, 0, 0);
}

/** Slow-drifting ember/ash motes — deterministic from time, no state. */
export function drawMotes(ctx: CanvasRenderingContext2D, W: number, H: number, now: number, color: string, count = 14): void {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const speed = 12 + (i % 5) * 6;
    const x = ((i * 173 + now * 0.006 * (10 + (i % 4) * 3)) % (W + 40)) - 20;
    const y = H - (((i * 97 + now * 0.001 * speed * 16) % (H + 40)) - 20);
    const s = 1 + (i % 3);
    ctx.globalAlpha = 0.10 + 0.10 * ((i * 7) % 3) + 0.06 * Math.sin(now / 700 + i);
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}

function drawBattleBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number, now: number, accent: string): void {
  // Dusk sky with a faint element-tinted band on the horizon.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#171225');
  bg.addColorStop(0.55, '#14111c');
  bg.addColorStop(1, '#0b0a10');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = accent;
  ctx.fillRect(0, 236, W, 90);
  ctx.globalAlpha = 1;

  // Two silhouetted ridge layers.
  for (const [base, amp, colr, seed] of [
    [252, 14, '#0f0d18', 0],
    [286, 20, '#0a0912', 3],
  ] as const) {
    ctx.fillStyle = colr;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 24) {
      ctx.lineTo(x, base + Math.sin(x / 90 + seed) * amp + Math.sin(x / 37 + seed * 2) * (amp / 3));
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  drawMotes(ctx, W, H, now, accent, 12);
}

function drawPlatform(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, color: string): void {
  ctx.fillStyle = '#0a0910';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, rx * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, rx * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function render(ctx: CanvasRenderingContext2D, c: Combat, now: number, info: RenderInfo): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  drawBattleBackdrop(ctx, W, H, now, ELEMENT_COLOR[info.enemyElement]);
  drawPlatform(ctx, W * 0.3, 288 + 36, 84, ELEMENT_COLOR[info.enemyElement]);
  drawPlatform(ctx, W * 0.7, 288 + 34, 74, ELEMENT_COLOR[c.playerElement]);

  drawEnemy(ctx, c, info, W);
  drawCurses(ctx, c, now);
  drawWraith(ctx, W * 0.3, 288, 58, { element: info.enemyElement, t: now, hit: info.enemyHit, facing: 1 });
  drawWraith(ctx, W * 0.7, 288, 52, { element: c.playerElement, t: now, hit: info.playerHit, facing: -1 });
  drawLane(ctx, c, now, W, H);
  drawKnell(ctx, c, W, H);
  drawBars(ctx, c, W, H);
  drawWards(ctx, c, W, H);
  drawPlayer(ctx, c, info, W, H);
  drawVignette(ctx, W, H);
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
  const profile = info.enemyProfile ? `  ‹${info.enemyProfile}›` : '';
  ctx.fillText(`${info.enemyName}  Lv${info.enemyLevel}  ${ELEMENT_GLYPH[info.enemyElement]} ${info.enemyElement}${profile}`, 24, 36);
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
  const lead = c.hasCurse('static', now) ? 2 * c.tickMs : 3 * c.tickMs; // Static: less lead time
  const xAt = (remaining: number): number => left + (nowX - left) * (1 - remaining / lead); // far→left, landing→NOW

  // Lane backdrop with a subtle gradient toward the NOW line.
  const lg = ctx.createLinearGradient(left, 0, nowX, 0);
  lg.addColorStop(0, '#0e0e17');
  lg.addColorStop(1, '#191420');
  ctx.fillStyle = lg;
  ctx.fillRect(left, laneY, W - left - 24, laneH);
  ctx.strokeStyle = '#23232f';
  ctx.strokeRect(left, laneY, W - left - 24, laneH);

  // Beat gridlines: one line per upcoming Knell, sliding toward NOW.
  const curTick = Math.floor((now - c.startTime) / c.tickMs);
  ctx.strokeStyle = '#2e2e40';
  for (let k = 1; k <= 3; k++) {
    const rem = c.timeOfTick(curTick + k) - now;
    if (rem < 0 || rem > lead) continue;
    const gx = xAt(rem);
    ctx.beginPath();
    ctx.moveTo(gx, laneY + 4);
    ctx.lineTo(gx, laneY + laneH - 4);
    ctx.stroke();
  }

  // The NOW line — bright, pulsing with the Knell.
  const pulse = 1 - c.tickProgress();
  ctx.strokeStyle = '#ffd54a';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.55 + pulse * 0.45;
  ctx.beginPath();
  ctx.moveTo(nowX, laneY - 8);
  ctx.lineTo(nowX, laneY + laneH + 8);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NOW', nowX, laneY - 12);
  ctx.fillStyle = '#5a5a6a';
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('◀ incoming — flick when it hits NOW', left + 110, laneY - 12);

  for (const t of c.telegraphs) {
    const landing = c.timeOfTick(t.landingTick);
    const remaining = landing - now;
    if (remaining > lead || remaining < -250) continue;
    const x = xAt(Math.max(0, remaining));
    const shown: Element = t.feintFrom && !t.flipped ? t.feintFrom : t.element;
    const col = ELEMENT_COLOR[shown];
    const cy = laneY + laneH / 2;
    const r = 20 + 4 * (1 - Math.min(1, Math.max(0, remaining) / lead)); // grows as it nears

    // motion trail
    if (!t.resolved) {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = col;
      for (let k = 1; k <= 3; k++) {
        const tx = xAt(Math.min(lead, Math.max(0, remaining) + k * 90));
        ctx.beginPath();
        ctx.arc(tx, cy, r - k * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // chip with glow
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = t.resolved ? 0 : 14;
    ctx.fillStyle = col;
    ctx.globalAlpha = t.resolved ? 0.22 : 1;
    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = t.resolved ? 0.4 : 1;
    ctx.fillStyle = '#0c0b10';
    ctx.font = 'bold 20px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ELEMENT_GLYPH[shown], x, cy + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = 1;

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
  bar(ctx, rx, y, (W - 72) / 2, 16, c.resolve / c.resolveMax, ready ? '#ff7ad9' : '#9a5bb0', `RESOLVE ${Math.round(c.resolve)}${ready ? '  [SPACE = STRIKE]' : ''}`);
}

/** Shared Ward-button geometry — drawing and touch hit-testing must always agree. */
export function wardRect(i: number, W: number, H: number): { x: number; y: number; w: number; h: number } {
  const n = ELEMENTS.length;
  const gap = 10;
  const w = (W - 48 - gap * (n - 1)) / n;
  return { x: 24 + i * (w + gap), y: H - 96, w, h: 54 };
}

/** Shared Strike (Resolve bar) geometry — drawing and touch hit-testing must always agree. */
export function strikeRect(W: number, H: number): { x: number; y: number; w: number; h: number } {
  return { x: 24 + (W - 72) / 2 + 24, y: H - 150, w: (W - 72) / 2, h: 40 };
}

function drawWards(ctx: CanvasRenderingContext2D, c: Combat, W: number, H: number): void {
  ELEMENTS.forEach((el, i) => {
    const r = wardRect(i, W, H);
    const up = c.activeElement === el;
    ctx.fillStyle = up ? ELEMENT_COLOR[el] : '#1b1b27';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = ELEMENT_COLOR[el];
    ctx.lineWidth = up ? 3 : 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.lineWidth = 1;
    ctx.fillStyle = up ? '#0c0b10' : ELEMENT_COLOR[el];
    ctx.font = 'bold 20px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ELEMENT_GLYPH[el], r.x + r.w / 2, r.y + 26);
    ctx.fillStyle = up ? '#0c0b10' : '#9a9aa8';
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`${i + 1} ${el}`, r.x + r.w / 2, r.y + 44);
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
  drawBattleBackdrop(ctx, W, H, now, ELEMENT_COLOR[info.wildElement]);
  drawPlatform(ctx, W / 2, 300 + 44, 96, ELEMENT_COLOR[info.wildElement]);

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 22px ui-monospace, monospace';
  ctx.fillText('BINDING RITE', W / 2, 32);
  ctx.fillStyle = ELEMENT_COLOR[info.wildElement];
  ctx.font = '14px ui-monospace, monospace';
  ctx.fillText(`Ward the ${info.wildName}'s strikes to bind it  —  strike ${rite.progressCount()} / ${rite.total}`, W / 2, 54);

  drawWraith(ctx, W / 2, 300, 70, { element: info.wildElement, t: now });
  drawVignette(ctx, W, H);
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
