export class ScoreSystem {
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
