export class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicNodes = null;
    this.musicSource = null;
    this.musicVolume = 0.35;
    this.sfxVolume = 0.5;
    this.sfxBuffers = new Map();
    this.musicBuffer = null;
    this.musicEl = null;
    this.sfxEls = new Map();
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
    if (this.musicEl) this.musicEl.volume = value;
  }
  setSfxVolume(value) {
    this.sfxVolume = value;
    if (this.sfxGain) this.sfxGain.gain.value = value;
  }
  async startMusic() {
    await this.resume();
    if (this.musicSource || this.musicEl) return;
    const buffer = await this._loadMusic();
    if (buffer && this.ctx) {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(this.musicGain);
      source.start();
      this.musicSource = source;
      return;
    }
    this._startMusicHtml();
  }
  stopMusic() {
    if (this.musicSource) {
      this.musicSource.stop();
      this.musicSource = null;
    }
    if (this.musicEl) {
      this.musicEl.pause();
      this.musicEl.currentTime = 0;
      this.musicEl = null;
    }
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
  async playBounce() {
    const playedHtml = this._playSampleHtml("ball-bounce");
    if (playedHtml) return;
    const played = await this._playSample("ball-bounce");
    if (played) return;
    await this.resume();
    if (!this.ctx) return;
    this._beep(320, 0.04, 0, 1.35);
  }
  async playPowerUp() {
    const playedHtml = this._playSampleHtml("double-ball-power");
    if (playedHtml) return;
    const played = await this._playSample("double-ball-power");
    if (played) return;
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
  async _playSample(key) {
    await this.resume();
    const buffer = await this._loadSample(key);
    if (buffer && this.ctx) {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.sfxGain);
      source.start();
      return true;
    }
    return this._playSampleHtml(key);
  }
  async _loadSample(key) {
    if (this.sfxBuffers.has(key)) return this.sfxBuffers.get(key);
    const url = `sounds/${key}.mp3`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.sfxBuffers.set(key, buffer);
      return buffer;
    } catch {
      return null;
    }
  }
  async _loadMusic() {
    if (this.musicBuffer) return this.musicBuffer;
    const url = "sounds/background-music.mp3";
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.musicBuffer = buffer;
      return buffer;
    } catch {
      return null;
    }
  }
  _startMusicHtml() {
    const audio = new Audio("sounds/background-music.mp3");
    audio.loop = true;
    audio.volume = this.musicVolume;
    audio.play().catch(() => {});
    this.musicEl = audio;
  }
  _playSampleHtml(key) {
    const url = `sounds/${key}.mp3`;
    const audio = new Audio(url);
    audio.volume = key === "ball-bounce" ? Math.min(this.sfxVolume * 1.35, 1) : this.sfxVolume;
    audio.play().catch(() => {});
    return true;
  }
  _beep(freq, duration, delay = 0, gainBoost = 1) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.value = Math.min(this.sfxVolume * gainBoost, 1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    const now = this.ctx.currentTime + delay;
    osc.start(now);
    osc.stop(now + duration);
  }
}
