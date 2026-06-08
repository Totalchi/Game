import { makeRng } from '../core/rng';
import { rollWild } from '../core/spawn';
import type { Mon } from '../core/mon';

/** Tile ids for the overworld map. */
export const T = {
  GRASS: 0,
  TALL: 1, // tall grass — wild Wraith encounters
  PATH: 2,
  WATER: 3,
  TREE: 4,
  ROCK: 5,
  FLOOR: 6, // sanctuary floor
  WALL: 7, // sanctuary wall
  ROOF: 8,
  FLOWER: 9,
  SHRINE: 10, // the Hollow Shrine — steps here summon a boss
} as const;
type Tile = (typeof T)[keyof typeof T];

const WALKABLE = new Set<number>([T.GRASS, T.TALL, T.PATH, T.FLOOR, T.FLOWER, T.SHRINE]);

export const TS = 30; // display tile size (px) — chunky, retro
const MOVE_MS = 150; // ms per tile step
const MAP_W = 42;
const MAP_H = 30;

type Dir = 'down' | 'up' | 'left' | 'right';

/**
 * A small top-down, tile-based overworld (GBA-monster-RPG style) rendered with chunky
 * "programmer-art" tiles. Walk with arrows/WASD; tall grass triggers wild encounters.
 * Real pixel-art sprites/tiles swap in later (see docs/ART_BIBLE.md §0).
 */
export class Overworld {
  map: Tile[][];
  tx: number;
  ty: number;
  private px: number;
  private py: number;
  dir: Dir = 'down';
  private moving = false;
  private moveStart = 0;
  private fromPx = 0;
  private fromPy = 0;
  private toPx = 0;
  private toPy = 0;
  private stepsSinceEncounter = 0;
  pendingEncounter: Mon | null = null;
  pendingBoss = false;
  pendingSanctuary = false;

  constructor(seed = 5) {
    const rng = makeRng(seed);
    this.map = buildMap(rng);
    // Start on the path near the Sanctuary.
    this.tx = 7;
    this.ty = 9;
    this.px = this.tx * TS;
    this.py = this.ty * TS;
  }

  private walkable(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
    return WALKABLE.has(this.map[ty][tx]);
  }

  update(now: number, held: Set<string>): void {
    if (!this.moving) {
      let dx = 0;
      let dy = 0;
      if (held.has('ArrowUp') || held.has('w')) {
        dy = -1;
        this.dir = 'up';
      } else if (held.has('ArrowDown') || held.has('s')) {
        dy = 1;
        this.dir = 'down';
      } else if (held.has('ArrowLeft') || held.has('a')) {
        dx = -1;
        this.dir = 'left';
      } else if (held.has('ArrowRight') || held.has('d')) {
        dx = 1;
        this.dir = 'right';
      }
      if ((dx || dy) && this.walkable(this.tx + dx, this.ty + dy)) {
        this.moving = true;
        this.moveStart = now;
        this.fromPx = this.px;
        this.fromPy = this.py;
        this.toPx = (this.tx + dx) * TS;
        this.toPy = (this.ty + dy) * TS;
        this.tx += dx;
        this.ty += dy;
      }
    } else {
      const t = (now - this.moveStart) / MOVE_MS;
      if (t >= 1) {
        this.px = this.toPx;
        this.py = this.toPy;
        this.moving = false;
        this.onArrive(now);
      } else {
        this.px = this.fromPx + (this.toPx - this.fromPx) * t;
        this.py = this.fromPy + (this.toPy - this.fromPy) * t;
      }
    }
  }

  private onArrive(now: number): void {
    this.stepsSinceEncounter++;
    if (this.map[this.ty][this.tx] === T.SHRINE) {
      this.pendingBoss = true;
      return;
    }
    if (this.map[this.ty][this.tx] === T.FLOOR) {
      this.pendingSanctuary = true;
      return;
    }
    if (this.map[this.ty][this.tx] === T.TALL && this.stepsSinceEncounter > 2) {
      // ~14% chance per tall-grass step.
      const r = makeRng(Math.floor(now) ^ (this.tx * 73856093) ^ (this.ty * 19349663))();
      if (r < 0.14) {
        this.stepsSinceEncounter = 0;
        this.pendingEncounter = rollWild(Math.floor(now) ^ (this.tx * 2654435761) ^ this.ty);
      }
    }
  }

  // ---- rendering ----
  render(ctx: CanvasRenderingContext2D, nowOrPulse: number): void {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    let camX = Math.round(this.px + TS / 2 - W / 2);
    let camY = Math.round(this.py + TS / 2 - H / 2);
    camX = Math.max(0, Math.min(MAP_W * TS - W, camX));
    camY = Math.max(0, Math.min(MAP_H * TS - H, camY));

    ctx.fillStyle = '#0e0d13';
    ctx.fillRect(0, 0, W, H);

    const x0 = Math.floor(camX / TS);
    const y0 = Math.floor(camY / TS);
    const x1 = Math.min(MAP_W, x0 + Math.ceil(W / TS) + 1);
    const y1 = Math.min(MAP_H, y0 + Math.ceil(H / TS) + 1);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        drawTile(ctx, this.map[y][x], x * TS - camX, y * TS - camY);
      }
    }
    this.drawPlayer(ctx, Math.round(this.px - camX), Math.round(this.py - camY), nowOrPulse);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, sx: number, sy: number, pulse: number): void {
    const bob = this.moving ? (Math.sin(pulse / 60) > 0 ? -1 : 0) : 0;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(sx + 6, sy + TS - 6, TS - 12, 5);
    // cloak
    px(ctx, sx + 6, sy + 8 + bob, TS - 12, TS - 12, '#56526a');
    // hood
    px(ctx, sx + 7, sy + 4 + bob, TS - 14, 9, '#454258');
    // facing hint (lighter opening)
    ctx.fillStyle = '#6b6880';
    const cx = sx + TS / 2;
    if (this.dir === 'down') ctx.fillRect(cx - 4, sy + 9 + bob, 8, 4);
    else if (this.dir === 'up') ctx.fillRect(cx - 4, sy + 5 + bob, 8, 3);
    else if (this.dir === 'left') ctx.fillRect(sx + 6, sy + 9 + bob, 4, 5);
    else ctx.fillRect(sx + TS - 10, sy + 9 + bob, 4, 5);
    // ward-sigil glow on chest
    const g = 0.5 + 0.5 * Math.sin(pulse / 120);
    ctx.fillStyle = `rgba(255,207,90,${0.5 + g * 0.5})`;
    ctx.fillRect(cx - 2, sy + 16 + bob, 4, 4);
  }
}

/** Draw a single pixel rect (crisp). */
function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawTile(ctx: CanvasRenderingContext2D, t: Tile, x: number, y: number): void {
  switch (t) {
    case T.GRASS:
      px(ctx, x, y, TS, TS, '#27331f');
      px(ctx, x + 6, y + 8, 3, 3, '#2f3d26');
      px(ctx, x + 18, y + 18, 3, 3, '#2f3d26');
      break;
    case T.TALL:
      px(ctx, x, y, TS, TS, '#33461f');
      px(ctx, x + 4, y + 6, 4, 10, '#43592a');
      px(ctx, x + 13, y + 4, 4, 12, '#4c6431');
      px(ctx, x + 21, y + 8, 4, 10, '#43592a');
      break;
    case T.PATH:
      px(ctx, x, y, TS, TS, '#403526');
      px(ctx, x + 5, y + 6, 4, 4, '#4a3e2d');
      px(ctx, x + 17, y + 16, 4, 4, '#4a3e2d');
      break;
    case T.WATER:
      px(ctx, x, y, TS, TS, '#16323f');
      px(ctx, x + 4, y + 10, 12, 2, '#22485a');
      px(ctx, x + 14, y + 20, 10, 2, '#22485a');
      break;
    case T.TREE:
      px(ctx, x, y, TS, TS, '#27331f');
      px(ctx, x + 12, y + 16, 6, 12, '#2b2018'); // trunk
      px(ctx, x + 3, y + 1, TS - 6, 18, '#1c2e1a'); // canopy
      px(ctx, x + 7, y + 4, 8, 7, '#26401f'); // hi
      break;
    case T.ROCK:
      px(ctx, x, y, TS, TS, '#27331f');
      px(ctx, x + 5, y + 8, TS - 10, TS - 14, '#343a42');
      px(ctx, x + 9, y + 11, 8, 5, '#414854');
      break;
    case T.FLOOR:
      px(ctx, x, y, TS, TS, '#3a3746');
      px(ctx, x, y, TS, 1, '#2c2a37');
      px(ctx, x, y, 1, TS, '#2c2a37');
      break;
    case T.WALL:
      px(ctx, x, y, TS, TS, '#4a4656');
      px(ctx, x + 2, y + 2, TS - 4, TS - 4, '#403c4d');
      break;
    case T.ROOF:
      px(ctx, x, y, TS, TS, '#5e3326');
      px(ctx, x + 2, y + 2, TS - 4, 6, '#7a4031');
      break;
    case T.FLOWER:
      px(ctx, x, y, TS, TS, '#27331f');
      px(ctx, x + 13, y + 13, 5, 5, '#ff5a1f');
      px(ctx, x + 6, y + 20, 4, 4, '#1fb6ff');
      break;
    case T.SHRINE:
      px(ctx, x, y, TS, TS, '#15131c');
      px(ctx, x + 4, y + 4, TS - 8, TS - 8, '#0a0910'); // void core
      px(ctx, x + 4, y + 4, TS - 8, 2, '#c77dff'); // rim-light
      px(ctx, x + 4, y + TS - 6, TS - 8, 2, '#c77dff');
      px(ctx, x + 12, y + 11, 6, 8, '#7a4fb0');
      break;
  }
}

function buildMap(rng: () => number): Tile[][] {
  const m: Tile[][] = [];
  for (let y = 0; y < MAP_H; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_W; x++) row.push(T.GRASS);
    m.push(row);
  }
  // Tree border.
  for (let x = 0; x < MAP_W; x++) {
    m[0][x] = T.TREE;
    m[MAP_H - 1][x] = T.TREE;
  }
  for (let y = 0; y < MAP_H; y++) {
    m[y][0] = T.TREE;
    m[y][MAP_W - 1] = T.TREE;
  }
  // Scatter trees, rocks, flowers.
  for (let i = 0; i < 60; i++) {
    const x = 2 + Math.floor(rng() * (MAP_W - 4));
    const y = 2 + Math.floor(rng() * (MAP_H - 4));
    const r = rng();
    m[y][x] = r < 0.6 ? T.TREE : r < 0.85 ? T.ROCK : T.FLOWER;
  }
  // A pond.
  for (let y = 18; y < 24; y++) for (let x = 26; x < 34; x++) m[y][x] = T.WATER;
  // Tall-grass patches.
  rect(m, 12, 5, 10, 6, T.TALL);
  rect(m, 24, 9, 8, 5, T.TALL);
  rect(m, 6, 18, 7, 6, T.TALL);
  // A vertical + horizontal path.
  for (let y = 6; y < MAP_H - 2; y++) m[y][7] = T.PATH;
  for (let x = 7; x < 26; x++) m[12][x] = T.PATH;
  // The Hollow Shrine at the east end of the path (boss).
  m[12][25] = T.SHRINE;
  m[11][25] = T.FLOOR;
  m[13][25] = T.FLOOR;
  m[12][26] = T.FLOOR;
  // Sanctuary building (top-left): floor + walls + roof + a door gap.
  rect(m, 4, 3, 6, 4, T.FLOOR);
  for (let x = 4; x < 10; x++) {
    m[3][x] = T.ROOF;
    m[6][x] = T.WALL;
  }
  m[6][7] = T.FLOOR; // door
  for (let y = 4; y < 6; y++) {
    m[y][4] = T.WALL;
    m[y][9] = T.WALL;
  }
  return m;
}

function rect(m: Tile[][], x0: number, y0: number, w: number, h: number, t: Tile): void {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (y > 0 && x > 0 && y < MAP_H - 1 && x < MAP_W - 1) m[y][x] = t;
  }
}
