import { GameConfig } from "./GameConfig.js";
import { GameState } from "./GameState.js";
import { UIManager } from "./UIManager.js";
import { PachinkoBoard } from "./PachinkoBoard.js";
import { BallFactory } from "./BallFactory.js";
import { ScoreSystem } from "./ScoreSystem.js";
import { SlotLabelManager } from "./SlotLabelManager.js";
import { PowerUp } from "./PowerUp.js";

export class Game {
  constructor(root, matter, audio) {
    this.root = root;
    this.Matter = matter;
    this.audio = audio;
    this.config = new GameConfig();
    this.state = new GameState(this.config);
    this.engine = this.Matter.Engine.create();
    this.engine.gravity.y = this.config.gravity;
    this.render = this.Matter.Render.create({
      element: root,
      engine: this.engine,
      options: {
        width: this.config.width,
        height: this.config.height,
        wireframes: false,
        background: "#0f1528",
      },
    });
    this.runner = this.Matter.Runner.create();
    this.board = new PachinkoBoard(this.Matter, this.engine, this.config);
    this.ballFactory = new BallFactory(this.Matter, this.config);
    this.scoreSystem = new ScoreSystem(this.config, this.state);
    this.ui = new UIManager(this.state, this.audio);
    this.slotLabels = new SlotLabelManager(
      document.getElementById("slot-labels"),
      this.config,
      this.scoreSystem
    );
    this.scoreFx = document.getElementById("score-fx");
    this.powerUp = new PowerUp(this.Matter, this.engine, this.config);
    this.activeBalls = new Set();
    this._bindEvents();
  }
  start() {
    if (this._started) return;
    this._started = true;
    this.board.build();
    this.powerUp.create();
    this.Matter.Render.run(this.render);
    this.Matter.Runner.run(this.runner, this.engine);
    this.ui.bind(() => this.dropBall(), () => this.reset());
    this.slotLabels.render();
    this.ui.render();
    if (!this._keyBound) {
      this._keyBound = true;
      window.addEventListener("keydown", (event) => {
        if (event.code === "Space") {
          event.preventDefault();
          this.dropBall();
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
    this.Matter.World.add(this.engine.world, ball);
    if (this.audio) this.audio.playDrop();
    this.ui.render();
  }
  reset() {
    this.Matter.Composite.clear(this.engine.world, false);
    this.activeBalls.clear();
    this.state.reset();
    this.board = new PachinkoBoard(this.Matter, this.engine, this.config);
    this.board.build();
    this.powerUp = new PowerUp(this.Matter, this.engine, this.config);
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
    this.Matter.Body.setVelocity(clone, {
      x: ball.velocity.x + (Math.random() - 0.5) * 2,
      y: ball.velocity.y - 1.5,
    });
    this.activeBalls.add(clone);
    this.Matter.World.add(this.engine.world, clone);
    if (this.audio) this.audio.playPowerUp();
  }
  _bindEvents() {
    this.Matter.Events.on(this.engine, "afterUpdate", () => {
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
        this.Matter.World.remove(this.engine.world, ballsToRemove);
        ballsToRemove.forEach((ball) => this.activeBalls.delete(ball));
        this.ui.render();
      }
    });

    this.Matter.Events.on(this.engine, "collisionStart", (event) => {
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
