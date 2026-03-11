export class GameConfig {
  constructor() {
    this.width = 720;
    this.height = 960;
    this.gravity = 1.1;
    this.ballRadius = 12;
    this.ballMinRadius = 6;
    this.ballRestitution = 0.6;
    this.ballFriction = 0.01;
    this.ballDensity = 0.002;
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
    this.powerUpTypes = [
      { id: "double", weight: 1 },
      { id: "shrink", weight: 1 },
      { id: "magnet", weight: 0.4 },
      { id: "repulsor", weight: 1 },
      { id: "slowmo", weight: 1 },
      { id: "turbo", weight: 1 },
      { id: "shield", weight: 1 },
      { id: "multiplier", weight: 1 },
      { id: "goldpin", weight: 1 },
      { id: "teleport", weight: 1 },
      { id: "ghost", weight: 1 },
      { id: "bounce", weight: 1 },
      { id: "split", weight: 1 },
      { id: "brake", weight: 1 },
      { id: "lucky", weight: 1 },
      { id: "time", weight: 1 },
      { id: "insurance", weight: 1 },
    ];
    this.powerUpDurations = {
      magnet: 4500,
      repulsor: 8000,
      slowmo: 6000,
      turbo: 6000,
      shield: 8000,
      multiplier: 8000,
      goldpin: 8000,
      teleport: 8000,
      ghost: 8000,
      bounce: 8000,
      split: 8000,
      brake: 8000,
      lucky: 8000,
    };
    this.shrinkFactor = 0.7;
    this.magnetForce = 0.0006;
    this.repulsorForce = 0.0005;
    this.edgeMargin = 120;
    this.slowMoFactor = 0.7;
    this.turboFactor = 1.3;
    this.bounceFactor = 1.35;
    this.brakeFactor = 0.7;
    this.scoreMultiplier = 2;
    this.luckySlotMultiplier = 3;
    this.goldenPinCount = 8;
    this.goldenPinBonus = 20;
    this.timeBonusSeconds = 8;
    this.timePowerScoreBonus = 150;
    this.insuranceBalls = 2;
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
    this.survivalPayoutBaseLow = 0.6;
    this.survivalPayoutBaseHigh = 0.25;
    this.survivalPayoutStepLow = 0.08;
    this.survivalPayoutStepHigh = 0.2;
    this.survivalPayoutBetScale = 1500;
    this.timerDuration = 60;
  }
}
