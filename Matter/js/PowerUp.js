export class PowerUp {
  constructor(matter, engine, config, getColors, type = "double") {
    this.Matter = matter;
    this.engine = engine;
    this.config = config;
    this.getColors = getColors;
    this.type = type;
    this.body = null;
    this.collected = false;
  }
  create() {
    const { Bodies, World } = this.Matter;
    const radius = this.config.powerUpRadius;
    const colors = this.getColors ? this.getColors() : {};
    const isShrink = this.type === "shrink";
    const fill = isShrink ? colors.powerupShrink : colors.powerup;
    const stroke = isShrink ? colors.powerupShrinkStroke : colors.powerupStroke;
    const minX = radius + 30;
    const maxX = this.config.width - radius - 30;
    const minY = 170;
    const lastPinY = 140 + (this.config.pinRows - 1) * 70;
    const maxY = Math.max(minY + 20, lastPinY - 40);
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    this.body = Bodies.circle(x, y, radius, {
      isSensor: true,
      isStatic: true,
      render: {
        fillStyle: fill || "#00f0ff",
        strokeStyle: stroke || "#ff4bd8",
        lineWidth: 2,
      },
    });
    this.body.label = "powerup";
    World.add(this.engine.world, this.body);
  }
  collect() {
    if (!this.body || this.collected) return;
    this.collected = true;
    this.Matter.World.remove(this.engine.world, this.body);
    this.body = null;
  }
}
