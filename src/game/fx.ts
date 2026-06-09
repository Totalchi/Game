/**
 * Lightweight visual juice: particles, screenshake, and full-screen flashes.
 * Purely cosmetic — never touches the simulation or its timing.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  color: string;
  size: number;
}

export class Fx {
  private parts: Particle[] = [];
  private shakeMag = 0;
  private shakeUntil = 0;
  private flashColor = '#fff';
  private flashStrength = 0;
  private flashUntil = 0;
  private flashDur = 1;

  burst(x: number, y: number, color: string, count: number, now: number, speed = 150): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      this.parts.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        born: now,
        life: 320 + Math.random() * 360,
        color,
        size: 2 + Math.floor(Math.random() * 3),
      });
    }
    if (this.parts.length > 400) this.parts.splice(0, this.parts.length - 400);
  }

  shake(mag: number, ms: number, now: number): void {
    if (now > this.shakeUntil || mag >= this.shakeMag) {
      this.shakeMag = mag;
      this.shakeUntil = now + ms;
    }
  }

  flash(color: string, strength: number, ms: number, now: number): void {
    this.flashColor = color;
    this.flashStrength = strength;
    this.flashDur = ms;
    this.flashUntil = now + ms;
  }

  /** Current screenshake offset (render translate). */
  offset(now: number): [number, number] {
    if (now >= this.shakeUntil || this.shakeMag <= 0) return [0, 0];
    const t = (this.shakeUntil - now) / 250; // decay toward the end
    const m = this.shakeMag * Math.min(1, t);
    return [(Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m];
  }

  drawParticles(ctx: CanvasRenderingContext2D, now: number): void {
    const alive: Particle[] = [];
    for (const p of this.parts) {
      const age = now - p.born;
      if (age > p.life) continue;
      alive.push(p);
      const f = age / p.life;
      const dt = age / 1000;
      const x = p.x + p.vx * dt;
      const y = p.y + p.vy * dt + 90 * dt * dt; // light gravity
      ctx.globalAlpha = 1 - f;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(x), Math.round(y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    this.parts = alive;
  }

  drawFlash(ctx: CanvasRenderingContext2D, now: number, w: number, h: number): void {
    if (now >= this.flashUntil) return;
    const f = (this.flashUntil - now) / this.flashDur;
    ctx.globalAlpha = this.flashStrength * f;
    ctx.fillStyle = this.flashColor;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }
}
