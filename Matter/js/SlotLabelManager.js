export class SlotLabelManager {
  constructor(container, config, scoreSystem) {
    this.container = container;
    this.config = config;
    this.scoreSystem = scoreSystem;
  }
  render() {
    this.container.style.gridTemplateColumns = `repeat(${this.config.slotCount}, 1fr)`;
    this.container.innerHTML = "";
    for (let i = 0; i < this.config.slotCount; i += 1) {
      const label = document.createElement("div");
      label.className = "slot-label";
      label.textContent = `${this.scoreSystem.pointsForSlot(i)} pts`;
      this.container.appendChild(label);
    }
  }
}
