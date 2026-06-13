import type { Element } from '../core/types';
import { ELEMENT_COLOR } from './colors';

function shade(hex: string, mul: number): string {
  const h = hex.replace('#', '');
  const r = Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * mul));
  const g = Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * mul));
  const b = Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * mul));
  return `rgb(${r},${g},${b})`;
}

export interface WraithDrawOpts {
  element: Element;
  t: number; // performance.now() for idle animation
  hit?: boolean; // brief white flash when struck
  facing?: 1 | -1; // -1 faces left
}

/**
 * Procedural "pixel-spirit" — an element-tinted creature drawn entirely in code
 * (no art assets needed). A rounded body, glowing eyes, a wispy tail, and an
 * element motif (flames/droplets/bolts/blocks/leaves/shards/void).
 */
export function drawWraith(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, opts: WraithDrawOpts): void {
  const col = ELEMENT_COLOR[opts.element];
  const bob = Math.sin(opts.t / 320) * size * 0.05;
  const y = cy + bob;
  const f = opts.facing ?? 1;
  const px = Math.max(2, Math.round(size / 14)); // chunky "pixel" unit

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.62, size * 0.5, size * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // wispy tail
  ctx.fillStyle = shade(col, 0.6);
  for (let i = 0; i < 3; i++) {
    const tw = size * (0.22 - i * 0.05);
    const ty = y + size * (0.3 + i * 0.18) + Math.sin(opts.t / 200 + i) * size * 0.04;
    ctx.beginPath();
    ctx.ellipse(cx - f * size * 0.05 * i, ty, tw, tw * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // body
  ctx.fillStyle = shade(col, 0.5);
  ctx.beginPath();
  ctx.ellipse(cx, y, size * 0.46, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(cx, y - size * 0.04, size * 0.38, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  // inner glow
  ctx.fillStyle = shade(col, 1.5);
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(cx, y - size * 0.08, size * 0.2, size * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawMotif(ctx, cx, y, size, opts, col, px);

  // eyes
  const ex = size * 0.15;
  const ey = y - size * 0.06;
  ctx.fillStyle = opts.element === 'hollow' ? '#d8d2e8' : '#fff';
  ctx.fillRect(cx - ex - px, ey, px * 2, px * 2);
  ctx.fillRect(cx + ex - px, ey, px * 2, px * 2);
  ctx.fillStyle = shade(col, 1.8);
  ctx.fillRect(cx - ex - px + f * 1, ey + 1, px, px);
  ctx.fillRect(cx + ex - px + f * 1, ey + 1, px, px);

  // hit flash
  if (opts.hit) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx, y, size * 0.5, size * 0.54, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawMotif(ctx: CanvasRenderingContext2D, cx: number, y: number, size: number, opts: WraithDrawOpts, col: string, px: number): void {
  const hi = shade(col, 1.6);
  const t = opts.t;
  switch (opts.element) {
    case 'ember': // flickering flames on top
      for (let i = -1; i <= 1; i++) {
        const fx = cx + i * size * 0.22;
        const fy = y - size * 0.46 - (1 + Math.sin(t / 120 + i)) * size * 0.06;
        ctx.fillStyle = hi;
        ctx.beginPath();
        ctx.moveTo(fx, fy - size * 0.16);
        ctx.lineTo(fx - px * 2, fy);
        ctx.lineTo(fx + px * 2, fy);
        ctx.closePath();
        ctx.fill();
      }
      break;
    case 'tide': // drifting droplets
      for (let i = 0; i < 4; i++) {
        const a = t / 600 + (i * Math.PI) / 2;
        ctx.fillStyle = hi;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * size * 0.5, y + Math.sin(a) * size * 0.42, px * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'storm': // side bolts
      ctx.strokeStyle = hi;
      ctx.lineWidth = px;
      for (const s of [-1, 1]) {
        const bx = cx + s * size * 0.5;
        ctx.beginPath();
        ctx.moveTo(bx, y - size * 0.3);
        ctx.lineTo(bx + s * px * 2, y - size * 0.05);
        ctx.lineTo(bx - s * px, y + size * 0.05);
        ctx.lineTo(bx + s * px * 2, y + size * 0.3);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      break;
    case 'stone': // orbiting blocks
      for (let i = 0; i < 3; i++) {
        const a = t / 900 + (i * Math.PI * 2) / 3;
        ctx.fillStyle = i % 2 ? hi : shade(col, 0.8);
        ctx.fillRect(cx + Math.cos(a) * size * 0.48 - px, y + Math.sin(a) * size * 0.4 - px, px * 2.4, px * 2.4);
      }
      break;
    case 'bloom': // spore dots
      for (let i = 0; i < 5; i++) {
        const a = t / 500 + (i * Math.PI * 2) / 5;
        ctx.fillStyle = hi;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * size * 0.5, y + Math.sin(a) * size * 0.45, px, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'frost': // crystal shards
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + t / 1400;
        const sx = cx + Math.cos(a) * size * 0.5;
        const sy = y + Math.sin(a) * size * 0.45;
        ctx.fillStyle = hi;
        ctx.beginPath();
        ctx.moveTo(sx, sy - px * 2);
        ctx.lineTo(sx + px, sy);
        ctx.lineTo(sx, sy + px * 2);
        ctx.lineTo(sx - px, sy);
        ctx.closePath();
        ctx.fill();
      }
      break;
    case 'hollow': // void rim
      ctx.strokeStyle = '#c77dff';
      ctx.lineWidth = px;
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t / 200);
      ctx.beginPath();
      ctx.ellipse(cx, y, size * 0.52, size * 0.56, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      break;
  }
}
