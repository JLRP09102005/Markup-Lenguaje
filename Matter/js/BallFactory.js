export class BallFactory {
  constructor(matter, config, getColors) {
    this.Matter = matter;
    this.config = config;
    this.getColors = getColors;
  }
  createBall(x, y) {
    const { Bodies } = this.Matter;
    const colors = this.getColors ? this.getColors() : {};
    return Bodies.circle(x, y, this.config.ballRadius, {
      restitution: 0.6,
      friction: 0.01,
      density: 0.002,
      render: { fillStyle: colors.ball || "#ff4bd8" },
    });
  }
}
