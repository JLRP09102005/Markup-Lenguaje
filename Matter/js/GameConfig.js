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
    this.bankStart = 1500;
    this.betMin = 25;
    this.betStep = 25;
    this.survivalBalls = 8;
    this.survivalTarget = 500;
    this.survivalTargetStep = 200;
    this.survivalBallStep = 1;
    this.survivalBallMin = 3;
    this.survivalScoreMultiplierStart = 1.0;
    this.survivalScoreMultiplierStep = -0.05;
    this.survivalScoreMultiplierMin = 0.7;
    this.survivalScoreMultiplierMax = 1.5;
    this.survivalPayoutBaseLow = 0.85;
    this.survivalPayoutBaseHigh = 0.35;
    this.survivalPayoutStepLow = 0.12;
    this.survivalPayoutStepHigh = 0.32;
    this.survivalPayoutBetScale = 1000;
    this.timerDuration = 60;
  }
}
