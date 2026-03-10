export class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicNodes = null;
    this.musicVolume = 0.35;
    this.sfxVolume = 0.5;
  }
  async ensureContext() {
    if (this.ctx) return this.ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    this.ctx = new AudioCtx();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.sfxGain.gain.value = this.sfxVolume;
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);
    return this.ctx;
  }
  async resume() {
    const ctx = await this.ensureContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
  }
  setMusicVolume(value) {
    this.musicVolume = value;
    if (this.musicGain) this.musicGain.gain.value = value;
  }
  setSfxVolume(value) {
    this.sfxVolume = value;
    if (this.sfxGain) this.sfxGain.gain.value = value;
  }
  async startMusic() {
    await this.resume();
    if (!this.ctx || this.musicNodes) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";
    osc1.frequency.value = 110;
    osc2.frequency.value = 220;
    lfo.type = "sine";
    lfo.frequency.value = 0.2;
    lfoGain.gain.value = 12;

    lfo.connect(lfoGain);
    lfoGain.connect(osc2.frequency);

    osc1.connect(this.musicGain);
    osc2.connect(this.musicGain);

    osc1.start();
    osc2.start();
    lfo.start();

    this.musicNodes = { osc1, osc2, lfo, lfoGain };
  }
  stopMusic() {
    if (!this.musicNodes) return;
    this.musicNodes.osc1.stop();
    this.musicNodes.osc2.stop();
    this.musicNodes.lfo.stop();
    this.musicNodes = null;
  }
  async playClick() {
    await this.resume();
    if (!this.ctx) return;
    this._beep(520, 0.05);
  }
  async playDrop() {
    await this.resume();
    if (!this.ctx) return;
    this._beep(320, 0.06);
  }
  async playBounce(intensity = 0.5) {
    await this.resume();
    if (!this.ctx) return;
    const freq = 240 + Math.floor(intensity * 260);
    this._beep(freq, 0.03 + intensity * 0.04);
  }
  async playPowerUp() {
    await this.resume();
    if (!this.ctx) return;
    this._beep(780, 0.09);
    this._beep(980, 0.08, 0.02);
  }
  async playScore(points, maxPoints) {
    await this.resume();
    if (!this.ctx) return;
    const ratio = Math.min(points / maxPoints, 1);
    this._beep(420 + ratio * 420, 0.08 + ratio * 0.08);
    if (ratio > 0.7) this._beep(980, 0.09, 0.03);
  }
  _beep(freq, duration, delay = 0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.value = this.sfxVolume;
    osc.connect(gain);
    gain.connect(this.sfxGain);
    const now = this.ctx.currentTime + delay;
    osc.start(now);
    osc.stop(now + duration);
  }
}
