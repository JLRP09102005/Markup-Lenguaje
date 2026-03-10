(function () {
  if (window.__pachinkoStarted || window.__pachinkoBooting) return;
  if (!window.Matter) {
    console.error("Matter.js no disponible");
    return;
  }
  const Matter = window.Matter;
  const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;

  class AudioManager {
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

  class ResultsManager {
    constructor(onReplay, onMenu) {
      this.onReplay = onReplay;
      this.onMenu = onMenu;
      this.overlay = document.getElementById("timer-results");
      this.listEl = document.getElementById("leaderboard");
      this.scoreEl = document.getElementById("final-score");
      this.replayBtn = document.getElementById("results-replay");
      this.menuBtn = document.getElementById("results-menu");
      this.clearBtn = document.getElementById("results-clear");
    }
    init() {
      this.replayBtn.addEventListener("click", () => {
        this.hide();
        this.onReplay();
      });
      this.menuBtn.addEventListener("click", () => {
        this.hide();
        this.onMenu();
      });
      this.clearBtn.addEventListener("click", () => {
        this._saveScores([]);
        this.listEl.innerHTML = "";
      });
    }
    show(score, duration) {
      if (!this.overlay.classList.contains("is-hidden")) return;
      const scores = this._loadScores();
      const exists = scores.some(
        (entry) => entry.score === score && entry.duration === duration
      );
      if (!exists) scores.push({ score, duration, at: Date.now() });
      scores.sort((a, b) => b.score - a.score);
      this._saveScores(scores);
      this.scoreEl.textContent = score;
      this.listEl.innerHTML = "";
      const grouped = new Map();
      scores.forEach((entry) => {
        const key = Number.isFinite(entry.duration) ? `${entry.duration}s` : "Sin tiempo";
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(entry);
      });
      Array.from(grouped.keys())
        .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
        .forEach((key) => {
          const title = document.createElement("div");
          title.className = "leader-title";
          title.textContent = `Tiempo: ${key}`;
          this.listEl.appendChild(title);
          grouped
            .get(key)
            .slice(0, 10)
            .forEach((entry, idx) => {
              const row = document.createElement("div");
              row.className = "leader-row";
              row.textContent = `${idx + 1}. ${entry.score}`;
              this.listEl.appendChild(row);
            });
        });
      this.overlay.classList.remove("is-hidden");
    }
    hide() {
      this.overlay.classList.add("is-hidden");
    }
    _loadScores() {
      try {
        const raw = localStorage.getItem("pachinko_timer_scores");
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    _saveScores(scores) {
      try {
        localStorage.setItem("pachinko_timer_scores", JSON.stringify(scores));
      } catch {
        // ignore
      }
    }
  }

  class SurvivalResultsManager {
    constructor(onReplay, onMenu) {
      this.onReplay = onReplay;
      this.onMenu = onMenu;
      this.overlay = document.getElementById("survival-results");
      this.listEl = document.getElementById("survival-leaderboard");
      this.roundsEl = document.getElementById("survival-final");
      this.replayBtn = document.getElementById("survival-replay");
      this.menuBtn = document.getElementById("survival-menu");
      this.clearBtn = document.getElementById("survival-clear");
    }
    init() {
      this.replayBtn.addEventListener("click", () => {
        this.hide();
        this.onReplay();
      });
      this.menuBtn.addEventListener("click", () => {
        this.hide();
        this.onMenu();
      });
      this.clearBtn.addEventListener("click", () => {
        this._saveScores([]);
        this.listEl.innerHTML = "";
      });
    }
    show(rounds) {
      if (!this.overlay.classList.contains("is-hidden")) return;
      const scores = this._loadScores();
      const exists = scores.some((entry) => entry.rounds === rounds);
      if (!exists) scores.push({ rounds, at: Date.now() });
      scores.sort((a, b) => b.rounds - a.rounds);
      this._saveScores(scores);
      this.roundsEl.textContent = rounds;
      this.listEl.innerHTML = "";
      scores.slice(0, 10).forEach((entry, idx) => {
        const row = document.createElement("div");
        row.className = "leader-row";
        row.textContent = `${idx + 1}. ${entry.rounds}`;
        this.listEl.appendChild(row);
      });
      this.overlay.classList.remove("is-hidden");
    }
    hide() {
      this.overlay.classList.add("is-hidden");
    }
    _loadScores() {
      try {
        const raw = localStorage.getItem("pachinko_survival_rounds");
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    _saveScores(scores) {
      try {
        localStorage.setItem("pachinko_survival_rounds", JSON.stringify(scores));
      } catch {
        // ignore
      }
    }
  }

  class MenuManager {
    constructor(audio, onPlay, onThemeChange, onModeSelect) {
      this.audio = audio;
      this.onPlay = onPlay;
      this.onThemeChange = onThemeChange;
      this.onModeSelect = onModeSelect;
      this.menu = document.getElementById("menu");
      this.mainPanel = document.getElementById("menu-main");
      this.pausePanel = document.getElementById("menu-pause");
      this.optionsPanel = document.getElementById("menu-options");
      this.modesPanel = document.getElementById("menu-modes");
      this.timerPanel = document.getElementById("menu-timer");
      this.playBtn = document.getElementById("menu-play");
      this.optionsBtn = document.getElementById("menu-options-btn");
      this.exitBtn = document.getElementById("menu-exit");
      this.backBtn = document.getElementById("menu-back");
      this.modeSurvivalBtn = document.getElementById("mode-survival");
      this.modeTimerBtn = document.getElementById("mode-timer");
      this.modeBackBtn = document.getElementById("mode-back");
      this.timerSeconds = document.getElementById("timer-seconds");
      this.timerStartBtn = document.getElementById("timer-start");
      this.timerBackBtn = document.getElementById("timer-back");
      this.pauseOptionsBtn = document.getElementById("pause-options");
      this.pauseMainBtn = document.getElementById("pause-main");
      this.pauseModesBtn = document.getElementById("pause-modes");
      this.musicRange = document.getElementById("opt-music");
      this.sfxRange = document.getElementById("opt-sfx");
      this.toggleGlow = document.getElementById("opt-glow");
      this.toggleMotion = document.getElementById("opt-motion");
      this.themeSelect = document.getElementById("opt-theme");
    }
    init() {
      this._pauseOpen = false;
      this.menu.classList.remove("is-hidden");
      this.mainPanel.hidden = false;
      this.pausePanel.hidden = true;
      this.pausePanel.classList.add("is-hidden");
      this.optionsPanel.hidden = true;
      this.optionsPanel.classList.add("is-hidden");
      this.modesPanel.hidden = true;
      this.modesPanel.classList.add("is-hidden");
      this.timerPanel.hidden = true;
      this.timerPanel.classList.add("is-hidden");
      [this.playBtn, this.optionsBtn, this.exitBtn, this.backBtn].forEach((btn) => {
        if (!btn) return;
        btn.addEventListener("mouseenter", () => {
          this.audio.playClick();
        });
      });
      this.playBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        this.openModes();
      });
      this.optionsBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        this.openOptions();
      });
      this.pauseOptionsBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        this.openOptions();
      });
      this.pauseMainBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        this._pauseOpen = false;
        this.openMain();
      });
      this.pauseModesBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        this._pauseOpen = false;
        this.openModes();
      });
      this.backBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        if (this._pauseOpen) return this.openPause();
        this.openMain();
      });
      this.modeBackBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        this.openMain();
      });
      this.timerBackBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        this.openModes();
      });
      this.modeSurvivalBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        await this.audio.startMusic();
        this.menu.classList.add("is-hidden");
        if (this.onModeSelect) this.onModeSelect("survival");
        this.onPlay();
      });
      this.modeTimerBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        this.openTimer();
      });
      this.timerStartBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        await this.audio.startMusic();
        this.menu.classList.add("is-hidden");
        const seconds = parseInt(this.timerSeconds.value, 10);
        if (this.onModeSelect) {
          this.onModeSelect("timer", { duration: Number.isFinite(seconds) ? seconds : 60 });
        }
        this.onPlay();
      });
      this.exitBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        window.close();
        window.location.href = "about:blank";
      });

      this.musicRange.addEventListener("input", (e) => {
        this.audio.setMusicVolume(parseFloat(e.target.value));
      });
      this.sfxRange.addEventListener("input", (e) => {
        this.audio.setSfxVolume(parseFloat(e.target.value));
      });
      this.toggleGlow.addEventListener("change", (e) => {
        document.body.classList.toggle("no-glow", !e.target.checked);
      });
      this.toggleMotion.addEventListener("change", (e) => {
        document.body.classList.toggle("reduce-motion", e.target.checked);
      });
      this.themeSelect.addEventListener("change", (e) => {
        document.body.classList.remove(
          "theme-emerald",
          "theme-solar",
          "theme-violet",
          "theme-noir"
        );
        if (e.target.value !== "cyber") {
          document.body.classList.add(`theme-${e.target.value}`);
        }
        if (this.onThemeChange) this.onThemeChange();
      });

      window.addEventListener("keydown", (event) => {
        if (event.code !== "Escape") return;
        event.preventDefault();
        if (this.menu.classList.contains("is-hidden")) {
          this.menu.classList.remove("is-hidden");
          this._pauseOpen = true;
          this.openPause();
          return;
        }
        if (this._pauseOpen) {
          this.menu.classList.add("is-hidden");
          this._pauseOpen = false;
          return;
        }
        this.menu.classList.add("is-hidden");
        this._pauseOpen = false;
      });
    }

    openOptions() {
      this.mainPanel.hidden = true;
      this.pausePanel.hidden = true;
      this.optionsPanel.hidden = false;
      this.mainPanel.classList.add("is-hidden");
      this.pausePanel.classList.add("is-hidden");
      this.optionsPanel.classList.remove("is-hidden");
      this.modesPanel.hidden = true;
      this.modesPanel.classList.add("is-hidden");
      this.timerPanel.hidden = true;
      this.timerPanel.classList.add("is-hidden");
    }

    openMain() {
      this.optionsPanel.hidden = true;
      this.pausePanel.hidden = true;
      this.mainPanel.hidden = false;
      this.optionsPanel.classList.add("is-hidden");
      this.pausePanel.classList.add("is-hidden");
      this.mainPanel.classList.remove("is-hidden");
      this.modesPanel.hidden = true;
      this.modesPanel.classList.add("is-hidden");
      this.timerPanel.hidden = true;
      this.timerPanel.classList.add("is-hidden");
    }

    openPause() {
      this.mainPanel.hidden = true;
      this.optionsPanel.hidden = true;
      this.modesPanel.hidden = true;
      this.timerPanel.hidden = true;
      this.pausePanel.hidden = false;
      this.mainPanel.classList.add("is-hidden");
      this.optionsPanel.classList.add("is-hidden");
      this.modesPanel.classList.add("is-hidden");
      this.timerPanel.classList.add("is-hidden");
      this.pausePanel.classList.remove("is-hidden");
    }

    openModes() {
      this.mainPanel.hidden = true;
      this.pausePanel.hidden = true;
      this.modesPanel.hidden = false;
      this.mainPanel.classList.add("is-hidden");
      this.pausePanel.classList.add("is-hidden");
      this.modesPanel.classList.remove("is-hidden");
      this.optionsPanel.hidden = true;
      this.optionsPanel.classList.add("is-hidden");
      this.timerPanel.hidden = true;
      this.timerPanel.classList.add("is-hidden");
    }

    openTimer() {
      this.modesPanel.hidden = true;
      this.modesPanel.classList.add("is-hidden");
      this.timerPanel.hidden = false;
      this.timerPanel.classList.remove("is-hidden");
      this.mainPanel.hidden = true;
      this.mainPanel.classList.add("is-hidden");
      this.pausePanel.hidden = true;
      this.pausePanel.classList.add("is-hidden");
      this.optionsPanel.hidden = true;
      this.optionsPanel.classList.add("is-hidden");
    }

    showMenu() {
      this.menu.classList.remove("is-hidden");
      this._pauseOpen = false;
      this.openMain();
    }
    showTimer() {
      this.menu.classList.remove("is-hidden");
      this._pauseOpen = false;
      this.openTimer();
    }
    hideMenu() {
      this.menu.classList.add("is-hidden");
      this._pauseOpen = false;
    }
  }

  class GameConfig {
    constructor() {
      this.width = 720;
      this.height = 960;
      this.gravity = 1.1;
      this.ballRadius = 12;
      this.maxBalls = 5;
      this.pinRadius = 6;
      this.pinRows = 10;
      this.pinCols = 9;
      this.slotCount = 6;
      this.slotHeight = 80;
      this.spawnMargin = 40;
      this.powerUpRadius = 14;
      this.powerUpMin = 3;
      this.powerUpMax = 5;
      this.survivalBalls = 8;
      this.survivalTarget = 600;
      this.survivalTargetStep = 300;
      this.survivalBallStep = 0;
      this.survivalBallMin = 3;
      this.survivalScoreMultiplierStart = 1;
      this.survivalScoreMultiplierStep = -0.05;
      this.survivalScoreMultiplierMin = 0.7;
      this.survivalScoreMultiplierMax = 1.5;
      this.timerDuration = 60;
    }
  }

  class GameState {
    constructor(config) {
      this.config = config;
      this.score = 0;
      this.ballsLeft = config.maxBalls;
      this.lastSlot = "-";
    }
    addScore(points) {
      this.score += points;
    }
    useBall() {
      if (this.ballsLeft <= 0) return false;
      this.ballsLeft -= 1;
      return true;
    }
    reset() {
      this.score = 0;
      this.ballsLeft = this.config.maxBalls;
      this.lastSlot = "-";
    }
  }

  class UIManager {
    constructor(state, audio) {
      this.state = state;
      this.audio = audio;
      this.scoreEl = document.getElementById("score");
      this.ballsEl = document.getElementById("balls");
      this.lastSlotEl = document.getElementById("last-slot");
      this.hudScoreEl = document.getElementById("hud-score");
      this.hudBallsEl = document.getElementById("hud-balls");
      this.hudLastEl = document.getElementById("hud-last");
      this.modeEl = document.getElementById("mode");
      this.roundEl = document.getElementById("round");
      this.targetEl = document.getElementById("target");
      this.timeEl = document.getElementById("time-left");
      this.hudModeEl = document.getElementById("hud-mode");
      this.hudRoundEl = document.getElementById("hud-round");
      this.hudTargetEl = document.getElementById("hud-target");
      this.hudTimeEl = document.getElementById("hud-time");
      this.dropBtn = document.getElementById("drop");
      this.resetBtn = document.getElementById("reset");
    }
    bind(onDrop, onReset) {
      this.dropBtn.addEventListener("click", onDrop);
      this.resetBtn.addEventListener("click", onReset);
      this.dropBtn.addEventListener("mouseenter", () => {
        if (this.audio) this.audio.playClick();
      });
      this.resetBtn.addEventListener("mouseenter", () => {
        if (this.audio) this.audio.playClick();
      });
    }
    render(meta) {
      this.scoreEl.textContent = this.state.score;
      this.ballsEl.textContent = meta && meta.balls ? meta.balls : this.state.ballsLeft;
      this.lastSlotEl.textContent = this.state.lastSlot;
      this.hudScoreEl.textContent = this.state.score;
      this.hudBallsEl.textContent = meta && meta.balls ? meta.balls : this.state.ballsLeft;
      this.hudLastEl.textContent = this.state.lastSlot;
      if (meta) {
        const { mode, round, target, timeLeft } = meta;
        if (this.modeEl) this.modeEl.textContent = mode ?? "-";
        if (this.roundEl) this.roundEl.textContent = round ?? "-";
        if (this.targetEl) this.targetEl.textContent = target ?? "-";
        if (this.timeEl) this.timeEl.textContent = timeLeft ?? "-";
        if (this.hudModeEl) this.hudModeEl.textContent = mode ?? "-";
        if (this.hudRoundEl) this.hudRoundEl.textContent = round ?? "-";
        if (this.hudTargetEl) this.hudTargetEl.textContent = target ?? "-";
        if (this.hudTimeEl) this.hudTimeEl.textContent = timeLeft ?? "-";
      }
    }
  }

  class PachinkoBoard {
    constructor(engine, config, getColors) {
      this.engine = engine;
      this.config = config;
      this.getColors = getColors;
      this.pins = [];
      this.slots = [];
      this.walls = [];
    }
    build() {
      this._createWalls();
      this._createPins();
      this._createSlots();
    }
    _createWalls() {
      const { width, height } = this.config;
      const thickness = 30;
      const left = Bodies.rectangle(-thickness / 2, height / 2, thickness, height, {
        isStatic: true,
      });
      const right = Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, {
        isStatic: true,
      });
      const top = Bodies.rectangle(width / 2, -thickness / 2, width, thickness, {
        isStatic: true,
      });
      this.walls.push(left, right, top);
      World.add(this.engine.world, this.walls);
    }
    _createPins() {
      const { width, pinRows, pinCols, pinRadius } = this.config;
      const spacingX = width / (pinCols + 1);
      const spacingY = 70;
      const colors = this.getColors ? this.getColors() : {};
      for (let row = 0; row < pinRows; row += 1) {
        for (let col = 0; col < pinCols; col += 1) {
          const offset = row % 2 === 0 ? spacingX / 2 : 0;
          const x = spacingX + col * spacingX - offset;
          const y = 140 + row * spacingY;
          const pin = Bodies.circle(x, y, pinRadius, {
            isStatic: true,
            render: { fillStyle: colors.pin || "#00f0ff" },
          });
          this.pins.push(pin);
        }
      }
      World.add(this.engine.world, this.pins);
    }
    _createSlots() {
      const { width, height, slotCount, slotHeight } = this.config;
      const gap = width / slotCount;
      const colors = this.getColors ? this.getColors() : {};
      for (let i = 0; i <= slotCount; i += 1) {
        const x = i * gap;
        const wall = Bodies.rectangle(x, height - slotHeight / 2, 10, slotHeight, {
          isStatic: true,
          render: { fillStyle: colors.slot || "#1d2544" },
        });
        this.slots.push(wall);
      }
      World.add(this.engine.world, this.slots);
    }
  }

  class BallFactory {
    constructor(config, getColors) {
      this.config = config;
      this.getColors = getColors;
    }
    createBall(x, y) {
      const colors = this.getColors ? this.getColors() : {};
      return Bodies.circle(x, y, this.config.ballRadius, {
        restitution: 0.6,
        friction: 0.01,
        density: 0.002,
        render: { fillStyle: colors.ball || "#ff4bd8" },
      });
    }
  }

  class ScoreSystem {
    constructor(config, state) {
      this.config = config;
      this.state = state;
    }
    getSlotIndex(x) {
      const slotWidth = this.config.width / this.config.slotCount;
      return Math.min(Math.floor(x / slotWidth), this.config.slotCount - 1);
    }
    pointsForSlot(slotIndex) {
      const base = 50;
      const multiplier = slotIndex === 0 || slotIndex === this.config.slotCount - 1 ? 3 : 1;
      return base * multiplier;
    }
  }

  class SlotLabelManager {
    constructor(container, config, scoreSystem) {
      this.container = container;
      this.config = config;
      this.scoreSystem = scoreSystem;
    }
    render() {
      this.container.style.gridTemplateColumns = `repeat(${this.config.slotCount}, 1fr)`;
      this.container.innerHTML = "";
      for (let i = 0; i < this.config.slotCount; i += 1) {
        const label = document.createElement("div");
        label.className = "slot-label";
        label.textContent = `${this.scoreSystem.pointsForSlot(i)} pts`;
        this.container.appendChild(label);
      }
    }
  }

  class PowerUp {
    constructor(engine, config, getColors) {
      this.engine = engine;
      this.config = config;
      this.getColors = getColors;
      this.body = null;
      this.collected = false;
    }
    create() {
      const radius = this.config.powerUpRadius;
      const minX = radius + 30;
      const maxX = this.config.width - radius - 30;
      const minY = 170;
      const lastPinY = 140 + (this.config.pinRows - 1) * 70;
      const maxY = Math.max(minY + 20, lastPinY - 40);
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      const colors = this.getColors ? this.getColors() : {};
      this.body = Bodies.circle(x, y, radius, {
        isSensor: true,
        isStatic: true,
        render: {
          fillStyle: colors.powerup || "#00f0ff",
          strokeStyle: colors.powerupStroke || "#ff4bd8",
          lineWidth: 2,
        },
      });
      this.body.label = "powerup";
      World.add(this.engine.world, this.body);
    }
    collect() {
      if (!this.body || this.collected) return;
      this.collected = true;
      World.remove(this.engine.world, this.body);
      this.body = null;
    }
  }

  class Game {
    constructor(root, audio) {
      this.root = root;
      this.audio = audio;
      this.config = new GameConfig();
      this.state = new GameState(this.config);
      this.engine = Engine.create();
      this.engine.gravity.y = this.config.gravity;
      this.render = Render.create({
        element: root,
        engine: this.engine,
        options: {
          width: this.config.width,
          height: this.config.height,
          wireframes: false,
          background: "#0f1528",
        },
      });
      this.runner = Runner.create({
        isFixed: true,
        delta: 1000 / 60,
        frameDelta: 1000 / 60,
      });
      this.engine.timing.timeScale = 1;
      this.board = new PachinkoBoard(this.engine, this.config, () => this._getThemeColors());
      this.ballFactory = new BallFactory(this.config, () => this._getThemeColors());
      this.scoreSystem = new ScoreSystem(this.config, this.state);
      this.ui = new UIManager(this.state, this.audio);
      this.slotLabels = new SlotLabelManager(
        document.getElementById("slot-labels"),
        this.config,
        this.scoreSystem
      );
      this.scoreFx = document.getElementById("score-fx");
      this.powerUps = [];
      this.activeBalls = new Set();
      this.mode = null;
      this.round = 1;
      this.target = this.config.survivalTarget;
      this.timeLeft = this.config.timerDuration;
      this.timerDuration = this.config.timerDuration;
      this._lastTick = 0;
      this._timerEnded = false;
      this.onTimerEnd = null;
      this.onSurvivalEnd = null;
      this._bindEvents();
    }
    setMode(mode, options = {}) {
      this.mode = mode;
      this.round = 1;
      this.target = this.config.survivalTarget;
      this.timerDuration = options.duration || this.config.timerDuration;
      this.timeLeft = this.timerDuration;
      this._timerEnded = false;
      if (mode === "survival") {
        this.state.ballsLeft = this._getSurvivalBalls();
        this.state.score = 0;
      } else if (mode === "timer") {
        this.state.ballsLeft = Infinity;
        this.state.score = 0;
      }
      this.ui.render(this._getMeta());
    }
    start() {
      if (this._started) return;
      this._started = true;
      this.board.build();
      this._spawnPowerUps();
      this.applyTheme();
      Render.run(this.render);
      Runner.run(this.runner, this.engine);
      this.ui.bind(() => this.dropBall(), () => this.reset());
      this.slotLabels.render();
      this.ui.render(this._getMeta());
      if (!this._keyBound) {
        this._keyBound = true;
        window.addEventListener("keydown", (event) => {
          if (this._isMenuOpen()) return;
          if (event.code === "Space") {
            event.preventDefault();
            this.dropBall();
          } else if (event.code === "KeyR") {
            event.preventDefault();
            this.reset();
          }
        });
      }
    }
    dropBall() {
      if (this._isMenuOpen()) return;
      if (this.mode !== "timer" && !this.state.useBall()) return;
      if (this.mode === "timer" && this.timeLeft === 0) return;
      const margin = this.config.spawnMargin;
      const x = margin + Math.random() * (this.config.width - margin * 2);
      const y = 40;
      const ball = this.ballFactory.createBall(x, y);
      this.activeBalls.add(ball);
      World.add(this.engine.world, ball);
      if (this.audio) this.audio.playDrop();
      this.ui.render(this._getMeta());
    }
    reset() {
      if (this._isMenuOpen()) return;
      Composite.clear(this.engine.world, false);
      this.activeBalls.clear();
      this.state.reset();
      this._timerEnded = false;
      if (this.mode === "survival") {
        this.state.ballsLeft = this._getSurvivalBalls();
      } else if (this.mode === "timer") {
        this.state.ballsLeft = Infinity;
      }
      this.board = new PachinkoBoard(this.engine, this.config, () => this._getThemeColors());
      this.board.build();
      this._spawnPowerUps();
      this.applyTheme();
      this.slotLabels.render();
      this.ui.render(this._getMeta());
    }
    _spawnScoreFx(slotIndex, points) {
      const slotWidth = this.config.width / this.config.slotCount;
      const x = slotWidth * slotIndex + slotWidth / 2;
      const y = this.config.height - this.config.slotHeight - 10;
      const pop = document.createElement("div");
      const isStrong = points >= 150;
      pop.className = isStrong ? "score-pop strong" : "score-pop";
      pop.textContent = `+${points}`;
      pop.style.left = `${(x / this.config.width) * 100}%`;
      pop.style.top = `${(y / this.config.height) * 100}%`;
      this.scoreFx.appendChild(pop);
      pop.addEventListener("animationend", () => {
        pop.remove();
      });
    }

    _isMenuOpen() {
      const menu = document.getElementById("menu");
      const timerResults = document.getElementById("timer-results");
      const survivalResults = document.getElementById("survival-results");
      return (
        (menu && !menu.classList.contains("is-hidden")) ||
        (timerResults && !timerResults.classList.contains("is-hidden")) ||
        (survivalResults && !survivalResults.classList.contains("is-hidden"))
      );
    }
    _duplicateBall(ball) {
      const now = this.engine.timing.timestamp;
      if (!ball.plugin) ball.plugin = {};
      if (ball.plugin.lastDuped && now - ball.plugin.lastDuped < 350) return;
      ball.plugin.lastDuped = now;

      const clone = this.ballFactory.createBall(ball.position.x + 6, ball.position.y - 6);
      Body.setVelocity(clone, {
        x: ball.velocity.x + (Math.random() - 0.5) * 2,
        y: ball.velocity.y - 1.5,
      });
      this.activeBalls.add(clone);
      World.add(this.engine.world, clone);
      if (this.audio) this.audio.playPowerUp();
    }
    _bindEvents() {
      Events.on(this.engine, "afterUpdate", () => {
        const ballsToRemove = [];
      for (const ball of this.activeBalls) {
        if (ball.position.y > this.config.height + 40) {
          const slotIndex = this.scoreSystem.getSlotIndex(ball.position.x);
          const basePoints = this.scoreSystem.pointsForSlot(slotIndex);
          const multiplier = this.mode === "survival" ? this._getSurvivalMultiplier() : 1;
          const points = Math.round(basePoints * multiplier);
          this.state.addScore(points);
          this.state.lastSlot = String(slotIndex + 1);
          this._spawnScoreFx(slotIndex, points);
          if (this.audio) {
            const maxBase = this.scoreSystem.pointsForSlot(this.config.slotCount - 1);
            const maxPoints = Math.round(maxBase * multiplier);
            this.audio.playScore(points, maxPoints);
          }
          ballsToRemove.push(ball);
        }
      }
      if (ballsToRemove.length > 0) {
        World.remove(this.engine.world, ballsToRemove);
        ballsToRemove.forEach((ball) => this.activeBalls.delete(ball));
        this._checkModeProgress();
        this.ui.render(this._getMeta());
      }
      });

      Events.on(this.engine, "collisionStart", (event) => {
        for (const pair of event.pairs) {
          const a = pair.bodyA;
          const b = pair.bodyB;
          const isPowerUpA = a.label === "powerup";
          const isPowerUpB = b.label === "powerup";
          if (isPowerUpA && this.activeBalls.has(b)) {
            this._duplicateBall(b);
            this._collectPowerUp(a);
          } else if (isPowerUpB && this.activeBalls.has(a)) {
            this._duplicateBall(a);
            this._collectPowerUp(b);
          }
          const ball = this.activeBalls.has(a) ? a : this.activeBalls.has(b) ? b : null;
          if (ball && this.audio) {
            const now = this.engine.timing.timestamp;
            if (!ball.plugin) ball.plugin = {};
            if (!ball.plugin.lastBounce || now - ball.plugin.lastBounce > 80) {
              ball.plugin.lastBounce = now;
              this.audio.playBounce();
            }
          }
        }
      });

      Events.on(this.engine, "beforeUpdate", (event) => {
        if (this.mode !== "timer") return;
        if (this._timerEnded) return;
        const delta = event.delta || 16.7;
        this._lastTick += delta;
        if (this._lastTick >= 1000) {
          this._lastTick = 0;
          this.timeLeft = Math.max(0, this.timeLeft - 1);
          this.ui.render(this._getMeta());
          if (this.timeLeft === 0) {
            this._endTimerMode();
          }
        }
      });
    }

    _getMeta() {
      const balls =
        this.mode === "timer"
          ? "∞"
          : Number.isFinite(this.state.ballsLeft)
            ? this.state.ballsLeft
            : "-";
      return {
        mode: this.mode ? this.mode.toUpperCase() : "-",
        round: this.mode === "survival" ? this.round : "-",
        target: this.mode === "survival" ? this.target : "-",
        timeLeft: this.mode === "timer" ? `${this.timeLeft}s` : "-",
        balls,
      };
    }

    _checkModeProgress() {
      if (this.mode !== "survival") return;
      if (this.state.score >= this.target) {
        this.round += 1;
        this.target += this.config.survivalTargetStep;
        this.state.ballsLeft = this._getSurvivalBalls();
        this.state.score = 0;
        this.reset();
      } else if (this.state.ballsLeft === 0 && this.activeBalls.size === 0) {
        this._loseSurvival();
      }
    }

    _loseSurvival() {
      const survived = Math.max(0, this.round - 1);
      if (this.onSurvivalEnd) this.onSurvivalEnd(survived);
      this.round = 1;
      this.target = this.config.survivalTarget;
      this.state.score = 0;
      this.state.ballsLeft = this._getSurvivalBalls();
      this.reset();
    }

    _getSurvivalBalls() {
      const count = this.config.survivalBalls + (this.round - 1) * this.config.survivalBallStep;
      return Math.max(this.config.survivalBallMin, Math.round(count));
    }

    _getSurvivalMultiplier() {
      const raw =
        this.config.survivalScoreMultiplierStart +
        (this.round - 1) * this.config.survivalScoreMultiplierStep;
      return Math.min(
        this.config.survivalScoreMultiplierMax,
        Math.max(this.config.survivalScoreMultiplierMin, raw)
      );
    }

    _endTimerMode() {
      this.state.ballsLeft = 0;
      if (this._timerEnded) return;
      this._timerEnded = true;
      if (this.onTimerEnd) this.onTimerEnd(this.state.score, this.timerDuration);
    }

    _getThemeColors() {
      const styles = getComputedStyle(document.body);
      return {
        board: styles.getPropertyValue("--board").trim(),
        pin: styles.getPropertyValue("--pin").trim(),
        slot: styles.getPropertyValue("--slot").trim(),
        ball: styles.getPropertyValue("--ball").trim(),
        powerup: styles.getPropertyValue("--powerup").trim(),
        powerupStroke: styles.getPropertyValue("--powerup-stroke").trim(),
      };
    }

    applyTheme() {
      const colors = this._getThemeColors();
      if (colors.board) {
        this.render.options.background = colors.board;
      }
      this.board.pins.forEach((pin) => {
        pin.render.fillStyle = colors.pin;
      });
      this.board.slots.forEach((slot) => {
        slot.render.fillStyle = colors.slot;
      });
      this.activeBalls.forEach((ball) => {
        ball.render.fillStyle = colors.ball;
      });
      this.powerUps.forEach((powerUp) => {
        if (!powerUp.body) return;
        powerUp.body.render.fillStyle = colors.powerup;
        powerUp.body.render.strokeStyle = colors.powerupStroke;
      });
    }

    _spawnPowerUps() {
      this.powerUps = [];
      const total =
        this.mode === "timer"
          ? this.config.powerUpMax
          : this.config.powerUpMin +
            Math.floor(Math.random() * (this.config.powerUpMax - this.config.powerUpMin + 1));
      for (let i = 0; i < total; i += 1) {
        const powerUp = new PowerUp(this.engine, this.config, () => this._getThemeColors());
        powerUp.create();
        this.powerUps.push(powerUp);
      }
    }

    _collectPowerUp(body) {
      const target = this.powerUps.find((p) => p.body === body);
      if (target) {
        target.collect();
        if (this.mode === "timer") {
          const powerUp = new PowerUp(this.engine, this.config, () => this._getThemeColors());
          powerUp.create();
          this.powerUps.push(powerUp);
          this.applyTheme();
        }
      }
    }
  }

  const root = document.getElementById("game");
  const audio = new AudioManager();
  const game = new Game(root, audio);
  const menu = new MenuManager(
    audio,
    () => game.start(),
    () => game.applyTheme(),
    (mode, options) => game.setMode(mode, options)
  );
  const results = new ResultsManager(
    () => menu.showTimer(),
    () => menu.showMenu()
  );
  results.init();
  const survivalResults = new SurvivalResultsManager(
    async () => {
      await audio.startMusic();
      menu.hideMenu();
      game.setMode("survival");
      game.reset();
      game.start();
    },
    () => menu.showMenu()
  );
  survivalResults.init();
  menu.init();
  game.onTimerEnd = (score, duration) => results.show(score, duration);
  game.onSurvivalEnd = (rounds) => survivalResults.show(rounds);
  window.__pachinkoStarted = true;
})();
