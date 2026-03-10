export class SurvivalResultsManager {
  constructor(onReplay, onMenu) {
    this.onReplay = onReplay;
    this.onMenu = onMenu;
    this.overlay = document.getElementById("survival-results");
    this.listEl = document.getElementById("survival-leaderboard");
    this.roundsEl = document.getElementById("survival-final");
    this.replayBtn = document.getElementById("survival-replay");
    this.menuBtn = document.getElementById("survival-menu");
    this.clearBtn = document.getElementById("survival-clear");
  }

  init() {
    this.replayBtn.addEventListener("click", () => {
      this.hide();
      this.onReplay();
    });
    this.menuBtn.addEventListener("click", () => {
      this.hide();
      this.onMenu();
    });
    this.clearBtn.addEventListener("click", () => {
      this._saveScores([]);
      this.listEl.innerHTML = "";
    });
  }

  show(rounds) {
    if (!this.overlay.classList.contains("is-hidden")) return;
    const scores = this._loadScores();
    const exists = scores.some((entry) => entry.rounds === rounds);
    if (!exists) scores.push({ rounds, at: Date.now() });
    scores.sort((a, b) => b.rounds - a.rounds);
    this._saveScores(scores);
    this.roundsEl.textContent = rounds;
    this.listEl.innerHTML = "";
    scores.slice(0, 10).forEach((entry, idx) => {
      const row = document.createElement("div");
      row.className = "leader-row";
      row.textContent = `${idx + 1}. ${entry.rounds}`;
      this.listEl.appendChild(row);
    });
    this.overlay.classList.remove("is-hidden");
  }

  hide() {
    this.overlay.classList.add("is-hidden");
  }

  _loadScores() {
    try {
      const raw = localStorage.getItem("pachinko_survival_rounds");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _saveScores(scores) {
    try {
      localStorage.setItem("pachinko_survival_rounds", JSON.stringify(scores));
    } catch {
      // ignore
    }
  }
}
