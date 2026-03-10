export class BallFactory {
  constructor(matter, config) {
    this.Matter = matter;
    this.config = config;
  }
  createBall(x, y) {
    const { Bodies } = this.Matter;
    return Bodies.circle(x, y, this.config.ballRadius, {
      restitution: 0.6,
      friction: 0.01,
      density: 0.002,
      render: { fillStyle: "#ff4bd8" },
    });
  }
}
