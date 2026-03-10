export class ResultsManager {
  constructor(onReplay, onMenu) {
    this.onReplay = onReplay;
    this.onMenu = onMenu;
    this.overlay = document.getElementById("timer-results");
    this.listEl = document.getElementById("leaderboard");
    this.scoreEl = document.getElementById("final-score");
    this.replayBtn = document.getElementById("results-replay");
    this.menuBtn = document.getElementById("results-menu");
    this.clearBtn = document.getElementById("results-clear");
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
  show(score, duration) {
    if (!this.overlay.classList.contains("is-hidden")) return;
    const scores = this._loadScores();
    scores.push({ score, duration, at: Date.now() });
    scores.sort((a, b) => b.score - a.score);
    this._saveScores(scores);
    this.scoreEl.textContent = score;
    this.listEl.innerHTML = "";
    const grouped = new Map();
    scores.forEach((entry) => {
      const key = Number.isFinite(entry.duration) ? `${entry.duration}s` : "Sin tiempo";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(entry);
    });
    Array.from(grouped.keys())
      .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
      .forEach((key) => {
        const title = document.createElement("div");
        title.className = "leader-title";
        title.textContent = `Tiempo: ${key}`;
        this.listEl.appendChild(title);
        grouped
          .get(key)
          .slice(0, 10)
          .forEach((entry, idx) => {
            const row = document.createElement("div");
            row.className = "leader-row";
            row.textContent = `${idx + 1}. ${entry.score}`;
            this.listEl.appendChild(row);
          });
      });
    this.overlay.classList.remove("is-hidden");
  }
  hide() {
    this.overlay.classList.add("is-hidden");
  }
  _loadScores() {
    try {
      const raw = localStorage.getItem("pachinko_timer_scores");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  _saveScores(scores) {
    try {
      localStorage.setItem("pachinko_timer_scores", JSON.stringify(scores));
    } catch {
      // ignore
    }
  }
}
