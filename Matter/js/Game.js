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
    this.runner.isFixed = false;
    this.runner.delta = 1000 / 60;
    this.runner.maxFrameTime = 1000 / 30;
    this.engine.timing.timeScale = 1;
    this.board = new PachinkoBoard(this.Matter, this.engine, this.config, () =>
      this._getThemeColors()
    );
    this.ballFactory = new BallFactory(this.Matter, this.config, () =>
      this._getThemeColors()
    );
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
    this.onSurvivalEnd = null;
    this._bindEvents();
    this._loadEconomy();
  }
  setMode(mode, options = {}) {
    this.mode = mode;
    this.round = 1;
    this.target = this.config.survivalTarget;
    this.timerDuration = options.duration || this.config.timerDuration;
    this.timeLeft = this.timerDuration;
    this._timerEnded = false;
    if (Number.isFinite(options.bet)) {
      this.state.bet = options.bet;
    }
    if (mode === "survival") {
      this._ensureBetAffordable();
      this._applySurvivalBuyIn();
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
    this.Matter.Render.run(this.render);
    this.Matter.Runner.run(this.runner, this.engine);
    this.ui.bind(() => this.dropBall(), () => this.reset());
    this.ui.bindEconomy(
      () => this.adjustBet(-1),
      () => this.adjustBet(1)
    );
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
    if (this.mode === "timer") {
      // infinite balls
    } else if (!this.state.useBall()) {
      return;
    }
    const margin = this.config.spawnMargin;
    const x = margin + Math.random() * (this.config.width - margin * 2);
    const y = 40;
    const ball = this.ballFactory.createBall(x, y);
    this.activeBalls.add(ball);
    this.Matter.World.add(this.engine.world, ball);
    if (this.audio) this.audio.playDrop();
    this.ui.render(this._getMeta());
  }
  reset() {
    if (this._isMenuOpen()) return;
    this.Matter.Composite.clear(this.engine.world, false);
    this.activeBalls.clear();
    this.state.reset();
    this._timerEnded = false;
    if (this.mode === "survival") {
      this.state.ballsLeft = this._getSurvivalBalls();
    } else if (this.mode === "timer") {
      this.state.ballsLeft = Infinity;
    }
    this.board = new PachinkoBoard(this.Matter, this.engine, this.config, () =>
      this._getThemeColors()
    );
    this.board.build();
    this._spawnPowerUps();
    this.applyTheme();
    this.slotLabels.render();
    this.ui.render(this._getMeta());
  }

  adjustBet(direction) {
    const step = this.config.betStep;
    const maxBet = Math.max(this.state.bank, 0);
    const minBet = Math.min(this.config.betMin, maxBet);
    const next = this.state.bet + direction * step;
    this.state.bet = Math.max(minBet, Math.min(maxBet, next));
    this._saveEconomy();
    this.ui.render(this._getMeta());
  }

  _ensureBetAffordable() {
    const maxBet = Math.max(this.state.bank, 0);
    const minBet = Math.min(this.config.betMin, maxBet);
    if (this.state.bet > maxBet) this.state.bet = maxBet;
    if (this.state.bet < minBet) this.state.bet = minBet;
  }

  _applySurvivalBuyIn() {
    if (this.state.bet <= 0) return;
    if (this.state.bank >= this.state.bet) {
      this.state.bank -= this.state.bet;
      this._saveEconomy();
    } else {
      this.state.bet = 0;
    }
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
        this.Matter.World.remove(this.engine.world, ballsToRemove);
        ballsToRemove.forEach((ball) => this.activeBalls.delete(ball));
        this._checkModeProgress();
        this.ui.render(this._getMeta());
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
            const speed = Math.min(Math.hypot(ball.velocity.x, ball.velocity.y) / 8, 1);
            this.audio.playBounce(speed);
          }
        }
      }
    });

    this.Matter.Events.on(this.engine, "beforeUpdate", (event) => {
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
      payout: this.mode === "survival" ? this._getSurvivalPayout() : 0,
      balls,
    };
  }

  _checkModeProgress() {
    if (this.mode !== "survival") return;
    if (this.state.score >= this.target) {
      this._paySurvivalRound();
      this.round += 1;
      this.target += this.config.survivalTargetStep;
      this.state.ballsLeft = this._getSurvivalBalls();
      this.state.score = 0;
      this.reset();
    } else if (this.state.ballsLeft === 0 && this.activeBalls.size === 0) {
      this._loseSurvival();
    }
  }

  _paySurvivalRound() {
    const payout = this._getSurvivalPayout();
    this.state.bank += payout;
    this._saveEconomy();
  }

  _saveEconomy() {
    try {
      localStorage.setItem(
        "pachinko_economy",
        JSON.stringify({ bank: this.state.bank, bet: this.state.bet })
      );
    } catch {
      // ignore
    }
  }

  _loadEconomy() {
    try {
      const raw = localStorage.getItem("pachinko_economy");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Number.isFinite(data.bank)) this.state.bank = data.bank;
      if (Number.isFinite(data.bet)) this.state.bet = data.bet;
    } catch {
      // ignore
    }
  }

  _getSurvivalPayout() {
    const scale = Math.max(this.config.survivalPayoutBetScale, 1);
    const betFactor = Math.min(Math.max(this.state.bet / scale, 0), 1);
    const base =
      this.config.survivalPayoutBaseLow +
      (this.config.survivalPayoutBaseHigh - this.config.survivalPayoutBaseLow) * betFactor;
    const step =
      this.config.survivalPayoutStepLow +
      (this.config.survivalPayoutStepHigh - this.config.survivalPayoutStepLow) * betFactor;
    const multiplier = base + (this.round - 1) * step;
    return Math.round(this.state.bet * multiplier);
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
      const powerUp = new PowerUp(this.Matter, this.engine, this.config, () =>
        this._getThemeColors()
      );
      powerUp.create();
      this.powerUps.push(powerUp);
    }
  }

  _collectPowerUp(body) {
    const target = this.powerUps.find((p) => p.body === body);
    if (target) {
      target.collect();
      if (this.mode === "timer") {
        const powerUp = new PowerUp(this.Matter, this.engine, this.config, () =>
          this._getThemeColors()
        );
        powerUp.create();
        this.powerUps.push(powerUp);
        this.applyTheme();
      }
    }
  }
}
