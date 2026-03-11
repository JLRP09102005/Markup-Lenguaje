export class GameState {
  constructor(config) {
    this.config = config;
    this.score = 0;
    this.ballsLeft = config.maxBalls;
    this.lastSlot = "-";
    this.bank = config.bankStart;
    this.bet = config.betMin;
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
