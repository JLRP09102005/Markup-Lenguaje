export class GameConfig {
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
    this.powerUpMin = 3;
    this.powerUpMax = 5;
    this.survivalBalls = 8;
    this.survivalTarget = 600;
    this.survivalTargetStep = 300;
    this.timerDuration = 60;
  }
}
