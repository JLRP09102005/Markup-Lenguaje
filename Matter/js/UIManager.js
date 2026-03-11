export class UIManager {
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
    this.creditTopEl = document.getElementById("credit-top");
    this.betEl = document.getElementById("bet-value");
    this.betMinusBtn = document.getElementById("bet-minus");
    this.betPlusBtn = document.getElementById("bet-plus");
    this.betDisplayEl = document.getElementById("bet-display");
    this.payoutEl = document.getElementById("payout-display");
    this.prizeNoteEl = document.getElementById("prize-note");
    this.statEls = {
      score: Array.from(document.querySelectorAll('[data-stat="score"]')),
      balls: Array.from(document.querySelectorAll('[data-stat="balls"]')),
      last: Array.from(document.querySelectorAll('[data-stat="last"]')),
      mode: Array.from(document.querySelectorAll('[data-stat="mode"]')),
      round: Array.from(document.querySelectorAll('[data-stat="round"]')),
      target: Array.from(document.querySelectorAll('[data-stat="target"]')),
      time: Array.from(document.querySelectorAll('[data-stat="time"]')),
    };
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
  bindEconomy(onBetDown, onBetUp) {
    if (this.betMinusBtn) {
      this.betMinusBtn.addEventListener("click", onBetDown);
      this.betMinusBtn.addEventListener("mouseenter", () => {
        if (this.audio) this.audio.playClick();
      });
    }
    if (this.betPlusBtn) {
      this.betPlusBtn.addEventListener("click", onBetUp);
      this.betPlusBtn.addEventListener("mouseenter", () => {
        if (this.audio) this.audio.playClick();
      });
    }
  }
  render(meta) {
    if (this.scoreEl) this.scoreEl.textContent = this.state.score;
    if (this.ballsEl) {
      this.ballsEl.textContent = meta && meta.balls ? meta.balls : this.state.ballsLeft;
    }
    if (this.lastSlotEl) this.lastSlotEl.textContent = this.state.lastSlot;
    if (this.hudScoreEl) this.hudScoreEl.textContent = this.state.score;
    if (this.hudBallsEl) {
      this.hudBallsEl.textContent = meta && meta.balls ? meta.balls : this.state.ballsLeft;
    }
    if (this.hudLastEl) this.hudLastEl.textContent = this.state.lastSlot;
    this._setStat("score", this.state.score);
    this._setStat("balls", meta && meta.balls ? meta.balls : this.state.ballsLeft);
    this._setStat("last", this.state.lastSlot);
    if (this.creditTopEl) this.creditTopEl.textContent = this.state.bank;
    if (this.betEl) this.betEl.textContent = this.state.bet;
    if (this.betDisplayEl) this.betDisplayEl.textContent = this.state.bet;
    if (meta) {
      const { mode, round, target, timeLeft, payout } = meta;
      if (this.modeEl) this.modeEl.textContent = mode ?? "-";
      if (this.roundEl) this.roundEl.textContent = round ?? "-";
      if (this.targetEl) this.targetEl.textContent = target ?? "-";
      if (this.timeEl) this.timeEl.textContent = timeLeft ?? "-";
      if (this.hudModeEl) this.hudModeEl.textContent = mode ?? "-";
      if (this.hudRoundEl) this.hudRoundEl.textContent = round ?? "-";
      if (this.hudTargetEl) this.hudTargetEl.textContent = target ?? "-";
      if (this.hudTimeEl) this.hudTimeEl.textContent = timeLeft ?? "-";
      this._setStat("mode", mode ?? "-");
      this._setStat("round", round ?? "-");
      this._setStat("target", target ?? "-");
      this._setStat("time", timeLeft ?? "-");
      if (this.payoutEl) this.payoutEl.textContent = payout ?? 0;
      if (this.prizeNoteEl) {
        if (mode === "TIMER") {
          this.prizeNoteEl.textContent = "Sin premios en Timer";
        } else {
          this.prizeNoteEl.textContent = "Solo en modo Survival";
        }
      }
    }
  }

  _setStat(key, value) {
    const list = this.statEls[key];
    if (!list) return;
    list.forEach((el) => {
      el.textContent = value;
    });
  }
}
