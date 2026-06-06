/**
 * Minimal Web Audio cues. The Knell (heartbeat) is the spine; flicks chime; Perfect snaps.
 * Uses the sample-accurate audio clock conceptually; for the prototype we trigger on events.
 */
export class Audio {
  private ctx: AudioContext | null = null;
  enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        this.enabled = false;
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain: number): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  knell(): void {
    this.blip(70, 0.18, 'sine', 0.25); // low heartbeat thump
  }
  flick(): void {
    this.blip(440, 0.06, 'triangle', 0.12);
  }
  perfect(): void {
    this.blip(880, 0.08, 'square', 0.16);
    this.blip(1320, 0.06, 'square', 0.1);
  }
  hit(): void {
    this.blip(120, 0.16, 'sawtooth', 0.2);
  }
}
