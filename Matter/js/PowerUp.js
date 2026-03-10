export class PowerUp {
  constructor(matter, engine, config, getColors) {
    this.Matter = matter;
    this.engine = engine;
    this.config = config;
    this.getColors = getColors;
    this.body = null;
    this.collected = false;
  }
  create() {
    const { Bodies, World } = this.Matter;
    const radius = this.config.powerUpRadius;
    const colors = this.getColors ? this.getColors() : {};
    const minX = radius + 30;
    const maxX = this.config.width - radius - 30;
    const minY = 170;
    const maxY = this.config.height / 2;
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    this.body = Bodies.circle(x, y, radius, {
      isSensor: true,
      isStatic: true,
      render: {
        fillStyle: colors.powerup || "#00f0ff",
        strokeStyle: colors.powerupStroke || "#ff4bd8",
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
