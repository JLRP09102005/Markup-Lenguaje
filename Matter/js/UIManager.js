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
