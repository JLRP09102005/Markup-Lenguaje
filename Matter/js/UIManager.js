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
