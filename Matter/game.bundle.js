(function () {
  if (window.__pachinkoStarted) return;
  if (!window.Matter) {
    console.error("Matter.js no disponible");
    return;
  }
  const Matter = window.Matter;
  const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;

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
    constructor(state) {
      this.state = state;
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
    constructor(root) {
      this.root = root;
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
      this.ui = new UIManager(this.state);
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
      }
    });
    }
  }

  const root = document.getElementById("game");
  const game = new Game(root);
  game.start();
  window.__pachinkoStarted = true;
})();
