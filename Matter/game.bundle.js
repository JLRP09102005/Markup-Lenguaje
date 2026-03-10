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

  class MenuManager {
    constructor(audio, onPlay, onThemeChange) {
      this.audio = audio;
      this.onPlay = onPlay;
      this.onThemeChange = onThemeChange;
      this.menu = document.getElementById("menu");
      this.mainPanel = document.getElementById("menu-main");
      this.optionsPanel = document.getElementById("menu-options");
      this.playBtn = document.getElementById("menu-play");
      this.optionsBtn = document.getElementById("menu-options-btn");
      this.exitBtn = document.getElementById("menu-exit");
      this.backBtn = document.getElementById("menu-back");
      this.musicRange = document.getElementById("opt-music");
      this.sfxRange = document.getElementById("opt-sfx");
      this.toggleGlow = document.getElementById("opt-glow");
      this.toggleMotion = document.getElementById("opt-motion");
      this.themeSelect = document.getElementById("opt-theme");
    }
    init() {
      this.menu.classList.remove("is-hidden");
      this.mainPanel.hidden = false;
      this.optionsPanel.hidden = true;
      this.optionsPanel.classList.add("is-hidden");
      [this.playBtn, this.optionsBtn, this.exitBtn, this.backBtn].forEach((btn) => {
        if (!btn) return;
        btn.addEventListener("mouseenter", () => {
          this.audio.playClick();
        });
      });
      this.playBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        await this.audio.startMusic();
        this.menu.classList.add("is-hidden");
        this.onPlay();
      });
      this.optionsBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        this.openOptions();
      });
      this.backBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        this.openMain();
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
          this.openOptions();
          return;
        }
        if (!this.optionsPanel.hidden) {
          this.menu.classList.add("is-hidden");
          return;
        }
        this.menu.classList.add("is-hidden");
      });
    }

    openOptions() {
      this.mainPanel.hidden = true;
      this.optionsPanel.hidden = false;
      this.mainPanel.classList.add("is-hidden");
      this.optionsPanel.classList.remove("is-hidden");
    }

    openMain() {
      this.optionsPanel.hidden = true;
      this.mainPanel.hidden = false;
      this.optionsPanel.classList.add("is-hidden");
      this.mainPanel.classList.remove("is-hidden");
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
    render() {
      this.scoreEl.textContent = this.state.score;
      this.ballsEl.textContent = this.state.ballsLeft;
      this.lastSlotEl.textContent = this.state.lastSlot;
      this.hudScoreEl.textContent = this.state.score;
      this.hudBallsEl.textContent = this.state.ballsLeft;
      this.hudLastEl.textContent = this.state.lastSlot;
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
      const maxY = this.config.height / 2;
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
      this.runner = Runner.create();
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
      this.powerUp = new PowerUp(this.engine, this.config, () => this._getThemeColors());
      this.activeBalls = new Set();
      this._bindEvents();
    }
    start() {
      if (this._started) return;
      this._started = true;
      this.board.build();
      this.powerUp.create();
      this.applyTheme();
      Render.run(this.render);
      Runner.run(this.runner, this.engine);
      this.ui.bind(() => this.dropBall(), () => this.reset());
      this.slotLabels.render();
      this.ui.render();
      if (!this._keyBound) {
        this._keyBound = true;
        window.addEventListener("keydown", (event) => {
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
      if (!this.state.useBall()) return;
      const margin = this.config.spawnMargin;
      const x = margin + Math.random() * (this.config.width - margin * 2);
      const y = 40;
      const ball = this.ballFactory.createBall(x, y);
      this.activeBalls.add(ball);
      World.add(this.engine.world, ball);
      if (this.audio) this.audio.playDrop();
      this.ui.render();
    }
    reset() {
      Composite.clear(this.engine.world, false);
      this.activeBalls.clear();
      this.state.reset();
      this.board = new PachinkoBoard(this.engine, this.config, () => this._getThemeColors());
      this.board.build();
      this.powerUp = new PowerUp(this.engine, this.config, () => this._getThemeColors());
      this.powerUp.create();
      this.applyTheme();
      this.slotLabels.render();
      this.ui.render();
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
            const points = this.scoreSystem.pointsForSlot(slotIndex);
            this.state.addScore(points);
            this.state.lastSlot = String(slotIndex + 1);
            this._spawnScoreFx(slotIndex, points);
            if (this.audio) {
              const maxPoints = this.scoreSystem.pointsForSlot(this.config.slotCount - 1);
              this.audio.playScore(points, maxPoints);
            }
            ballsToRemove.push(ball);
          }
        }
        if (ballsToRemove.length > 0) {
          World.remove(this.engine.world, ballsToRemove);
          ballsToRemove.forEach((ball) => this.activeBalls.delete(ball));
          this.ui.render();
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
            this.powerUp.collect();
          } else if (isPowerUpB && this.activeBalls.has(a)) {
            this._duplicateBall(a);
            this.powerUp.collect();
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
      if (this.powerUp.body) {
        this.powerUp.body.render.fillStyle = colors.powerup;
        this.powerUp.body.render.strokeStyle = colors.powerupStroke;
      }
    }
  }

  const root = document.getElementById("game");
  const audio = new AudioManager();
  const game = new Game(root, audio);
  const menu = new MenuManager(audio, () => game.start(), () => game.applyTheme());
  menu.init();
  window.__pachinkoStarted = true;
})();
