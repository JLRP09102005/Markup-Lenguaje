export class PachinkoBoard {
  constructor(matter, engine, config) {
    this.Matter = matter;
    this.engine = engine;
    this.config = config;
    this.pins = [];
    this.slots = [];
    this.walls = [];
  }
  build() {
    this._createWalls();
    this._createPins();
    this._createSlots();
  }
  _createWalls() {
    const { Bodies, World } = this.Matter;
    const { width, height } = this.config;
    const thickness = 30;
    const left = Bodies.rectangle(-thickness / 2, height / 2, thickness, height, {
      isStatic: true,
    });
    const right = Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, {
      isStatic: true,
    });
    const top = Bodies.rectangle(width / 2, -thickness / 2, width, thickness, {
      isStatic: true,
    });
    this.walls.push(left, right, top);
    World.add(this.engine.world, this.walls);
  }
  _createPins() {
    const { Bodies, World } = this.Matter;
    const { width, pinRows, pinCols, pinRadius } = this.config;
    const spacingX = width / (pinCols + 1);
    const spacingY = 70;
    for (let row = 0; row < pinRows; row += 1) {
      for (let col = 0; col < pinCols; col += 1) {
        const offset = row % 2 === 0 ? spacingX / 2 : 0;
        const x = spacingX + col * spacingX - offset;
        const y = 140 + row * spacingY;
        const pin = Bodies.circle(x, y, pinRadius, {
          isStatic: true,
          render: { fillStyle: "#00f0ff" },
        });
        this.pins.push(pin);
      }
    }
    World.add(this.engine.world, this.pins);
  }
  _createSlots() {
    const { Bodies, World } = this.Matter;
    const { width, height, slotCount, slotHeight } = this.config;
    const gap = width / slotCount;
    for (let i = 0; i <= slotCount; i += 1) {
      const x = i * gap;
      const wall = Bodies.rectangle(x, height - slotHeight / 2, 10, slotHeight, {
        isStatic: true,
        render: { fillStyle: "#1d2544" },
      });
      this.slots.push(wall);
    }
    World.add(this.engine.world, this.slots);
  }
}
