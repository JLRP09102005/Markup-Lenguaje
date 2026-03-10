export class PowerUp {
  constructor(matter, engine, config) {
    this.Matter = matter;
    this.engine = engine;
    this.config = config;
    this.body = null;
    this._time = 0;
  }
  create() {
    const { Bodies, World } = this.Matter;
    const radius = this.config.powerUpRadius;
    this.body = Bodies.circle(this.config.width / 2, 20, radius, {
      isSensor: true,
      isStatic: true,
      render: { fillStyle: "#00f0ff", strokeStyle: "#ff4bd8", lineWidth: 2 },
    });
    this.body.label = "powerup";
    World.add(this.engine.world, this.body);
  }
  update(deltaMs) {
    if (!this.body) return;
    this._time += deltaMs;
    const angle = (this._time / 1000) * 0.9;
    const cx = this.config.width / 2;
    const cy = this.config.height / 2;
    const rx = this.config.width / 2 + 24;
    const ry = this.config.height / 2 + 20;
    const x = cx + Math.cos(angle) * rx;
    const y = cy + Math.sin(angle) * ry;
    this.Matter.Body.setPosition(this.body, { x, y });
  }
}
