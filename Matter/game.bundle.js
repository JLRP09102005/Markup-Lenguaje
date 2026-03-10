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

  class MenuManager {
    constructor(audio, onPlay) {
      this.audio = audio;
      this.onPlay = onPlay;
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
        this.mainPanel.hidden = true;
        this.optionsPanel.hidden = false;
      });
      this.backBtn.addEventListener("click", async () => {
        await this.audio.playClick();
        this.optionsPanel.hidden = true;
        this.mainPanel.hidden = false;
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
        document.body.classList.remove("theme-emerald");
        if (e.target.value === "emerald") {
          document.body.classList.add("theme-emerald");
        }
      });
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
    constructor(engine, config) {
      this.engine = engine;
      this.config = config;
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
      for (let row = 0; row < pinRows; row += 1) {
        for (let col = 0; col < pinCols; col += 1) {
          const offset = row % 2 === 0 ? spacingX / 2 : 0;
          const x = spacingX + col * spacingX - offset;
          const y = 140 + row * spacingY;
          const pin = Bodies.circle(x, y, pinRadius, {
            isStatic: true,
            render: { fillStyle: "#00f0ff" },
          });
          this.pins.push(pin);
        }
      }
      World.add(this.engine.world, this.pins);
    }
    _createSlots() {
      const { width, height, slotCount, slotHeight } = this.config;
      const gap = width / slotCount;
      for (let i = 0; i <= slotCount; i += 1) {
        const x = i * gap;
        const wall = Bodies.rectangle(x, height - slotHeight / 2, 10, slotHeight, {
          isStatic: true,
          render: { fillStyle: "#1d2544" },
        });
        this.slots.push(wall);
      }
      World.add(this.engine.world, this.slots);
    }
  }

  class BallFactory {
    constructor(config) {
      this.config = config;
    }
    createBall(x, y) {
      return Bodies.circle(x, y, this.config.ballRadius, {
        restitution: 0.6,
        friction: 0.01,
        density: 0.002,
        render: { fillStyle: "#ff4bd8" },
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
    constructor(engine, config) {
      this.engine = engine;
      this.config = config;
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
      this.body = Bodies.circle(x, y, radius, {
        isSensor: true,
        isStatic: true,
        render: { fillStyle: "#00f0ff", strokeStyle: "#ff4bd8", lineWidth: 2 },
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
      this.board = new PachinkoBoard(this.engine, this.config);
      this.ballFactory = new BallFactory(this.config);
      this.scoreSystem = new ScoreSystem(this.config, this.state);
      this.ui = new UIManager(this.state, this.audio);
      this.slotLabels = new SlotLabelManager(
        document.getElementById("slot-labels"),
        this.config,
        this.scoreSystem
      );
      this.scoreFx = document.getElementById("score-fx");
      this.powerUp = new PowerUp(this.engine, this.config);
      this.activeBalls = new Set();
      this._bindEvents();
    }
    start() {
      if (this._started) return;
      this._started = true;
      this.board.build();
      this.powerUp.create();
      Render.run(this.render);
      Runner.run(this.runner, this.engine);
      this.ui.bind(() => this.dropBall(), () => this.reset());
      this.slotLabels.render();
      this.ui.render();
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
      this.board = new PachinkoBoard(this.engine, this.config);
      this.board.build();
      this.powerUp = new PowerUp(this.engine, this.config);
      this.powerUp.create();
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
            const speed = Math.min(Math.hypot(ball.velocity.x, ball.velocity.y) / 8, 1);
            this.audio.playBounce(speed);
          }
        }
      }
    });
    }
  }

  const root = document.getElementById("game");
  const audio = new AudioManager();
  const game = new Game(root, audio);
  const menu = new MenuManager(audio, () => game.start());
  menu.init();
  window.__pachinkoStarted = true;
})();
