export class MenuManager {
  constructor(audio, onPlay, onThemeChange, onModeSelect, getEconomy) {
    this.audio = audio;
    this.onPlay = onPlay;
    this.onThemeChange = onThemeChange;
    this.onModeSelect = onModeSelect;
    this.getEconomy = getEconomy;
    this.menu = document.getElementById("menu");
    this.mainPanel = document.getElementById("menu-main");
    this.pausePanel = document.getElementById("menu-pause");
    this.optionsPanel = document.getElementById("menu-options");
    this.modesPanel = document.getElementById("menu-modes");
    this.survivalBetPanel = document.getElementById("menu-survival-bet");
    this.timerPanel = document.getElementById("menu-timer");
    this.playBtn = document.getElementById("menu-play");
    this.optionsBtn = document.getElementById("menu-options-btn");
    this.exitBtn = document.getElementById("menu-exit");
    this.backBtn = document.getElementById("menu-back");
    this.modeSurvivalBtn = document.getElementById("mode-survival");
    this.modeTimerBtn = document.getElementById("mode-timer");
    this.modeBackBtn = document.getElementById("mode-back");
    this.betInput = document.getElementById("bet-input");
    this.betBankEl = document.getElementById("bet-bank");
    this.betConfirmBtn = document.getElementById("bet-confirm");
    this.betBackBtn = document.getElementById("bet-back");
    this.betWarningEl = document.getElementById("bet-warning");
    this.timerSeconds = document.getElementById("timer-seconds");
    this.timerStartBtn = document.getElementById("timer-start");
    this.timerBackBtn = document.getElementById("timer-back");
    this.pauseOptionsBtn = document.getElementById("pause-options");
    this.pauseMainBtn = document.getElementById("pause-main");
    this.pauseModesBtn = document.getElementById("pause-modes");
    this.musicRange = document.getElementById("opt-music");
    this.sfxRange = document.getElementById("opt-sfx");
    this.toggleGlow = document.getElementById("opt-glow");
    this.toggleMotion = document.getElementById("opt-motion");
    this.themeSelect = document.getElementById("opt-theme");
  }
  init() {
    this._pauseOpen = false;
    this.menu.classList.remove("is-hidden");
    this.mainPanel.hidden = false;
    this.pausePanel.hidden = true;
    this.pausePanel.classList.add("is-hidden");
    this.optionsPanel.hidden = true;
    this.optionsPanel.classList.add("is-hidden");
    this.modesPanel.hidden = true;
    this.modesPanel.classList.add("is-hidden");
    this.survivalBetPanel.hidden = true;
    this.survivalBetPanel.classList.add("is-hidden");
    this.timerPanel.hidden = true;
    this.timerPanel.classList.add("is-hidden");
    [this.playBtn, this.optionsBtn, this.exitBtn, this.backBtn].forEach((btn) => {
      if (!btn) return;
      btn.addEventListener("mouseenter", () => {
        this.audio.playClick();
      });
    });
    this.playBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.openModes();
    });
    this.optionsBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.openOptions();
    });
    this.pauseOptionsBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.openOptions();
    });
    this.pauseMainBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this._pauseOpen = false;
      this.openMain();
    });
    this.pauseModesBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this._pauseOpen = false;
      this.openModes();
    });
    this.backBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      if (this._pauseOpen) return this.openPause();
      this.openMain();
    });
    this.modeBackBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.openMain();
    });
    this.betBackBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.openModes();
    });
    this.timerBackBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.openModes();
    });
    this.modeSurvivalBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.openSurvivalBet();
    });
    this.betConfirmBtn.addEventListener("click", async () => {
      if (this._isBetBlocked()) return;
      await this.audio.playClick();
      await this.audio.startMusic();
      this.menu.classList.add("is-hidden");
      const bet = this._sanitizeBetValue(this.betInput ? this.betInput.value : 0);
      if (this.onModeSelect) {
        this.onModeSelect("survival", { bet: Number.isFinite(bet) ? bet : 0 });
      }
      this.onPlay();
    });
    this.betInput.addEventListener("input", () => {
      this._syncBetPanel();
    });
    this.modeTimerBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.openTimer();
    });
    this.timerStartBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      await this.audio.startMusic();
      this.menu.classList.add("is-hidden");
      const seconds = parseInt(this.timerSeconds.value, 10);
      if (this.onModeSelect) {
        this.onModeSelect("timer", { duration: Number.isFinite(seconds) ? seconds : 60 });
      }
      this.onPlay();
    });
    this.exitBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      window.close();
      window.location.href = "about:blank";
    });

    this.musicRange.addEventListener("input", (e) => {
      this.audio.setMusicVolume(parseFloat(e.target.value));
    });
    this.sfxRange.addEventListener("input", (e) => {
      this.audio.setSfxVolume(parseFloat(e.target.value));
    });
    this.toggleGlow.addEventListener("change", (e) => {
      document.body.classList.toggle("no-glow", !e.target.checked);
    });
    this.toggleMotion.addEventListener("change", (e) => {
      document.body.classList.toggle("reduce-motion", e.target.checked);
    });
      this.themeSelect.addEventListener("change", (e) => {
        document.body.classList.remove(
          "theme-emerald",
          "theme-solar",
          "theme-violet",
          "theme-noir"
        );
        if (e.target.value !== "cyber") {
          document.body.classList.add(`theme-${e.target.value}`);
        }
        if (this.onThemeChange) this.onThemeChange();
      });

    window.addEventListener("keydown", (event) => {
      if (event.code !== "Escape") return;
      event.preventDefault();
      if (this.menu.classList.contains("is-hidden")) {
        this.menu.classList.remove("is-hidden");
        this._pauseOpen = true;
        this.openPause();
        return;
      }
      if (this._pauseOpen) {
        this.menu.classList.add("is-hidden");
        this._pauseOpen = false;
      }
    });
  }

  openOptions() {
    this.mainPanel.hidden = true;
    this.pausePanel.hidden = true;
    this.optionsPanel.hidden = false;
    this.survivalBetPanel.hidden = true;
    this.mainPanel.classList.add("is-hidden");
    this.pausePanel.classList.add("is-hidden");
    this.optionsPanel.classList.remove("is-hidden");
    this.modesPanel.hidden = true;
    this.modesPanel.classList.add("is-hidden");
    this.survivalBetPanel.classList.add("is-hidden");
    this.timerPanel.hidden = true;
    this.timerPanel.classList.add("is-hidden");
  }

  openMain() {
    this.optionsPanel.hidden = true;
    this.pausePanel.hidden = true;
    this.mainPanel.hidden = false;
    this.survivalBetPanel.hidden = true;
    this.optionsPanel.classList.add("is-hidden");
    this.pausePanel.classList.add("is-hidden");
    this.mainPanel.classList.remove("is-hidden");
    this.modesPanel.hidden = true;
    this.modesPanel.classList.add("is-hidden");
    this.survivalBetPanel.classList.add("is-hidden");
    this.timerPanel.hidden = true;
    this.timerPanel.classList.add("is-hidden");
  }

  openPause() {
    this.mainPanel.hidden = true;
    this.optionsPanel.hidden = true;
    this.modesPanel.hidden = true;
    this.timerPanel.hidden = true;
    this.survivalBetPanel.hidden = true;
    this.pausePanel.hidden = false;
    this.mainPanel.classList.add("is-hidden");
    this.optionsPanel.classList.add("is-hidden");
    this.modesPanel.classList.add("is-hidden");
    this.timerPanel.classList.add("is-hidden");
    this.survivalBetPanel.classList.add("is-hidden");
    this.pausePanel.classList.remove("is-hidden");
  }

  openModes() {
    this.mainPanel.hidden = true;
    this.pausePanel.hidden = true;
    this.modesPanel.hidden = false;
    this.survivalBetPanel.hidden = true;
    this.mainPanel.classList.add("is-hidden");
    this.pausePanel.classList.add("is-hidden");
    this.modesPanel.classList.remove("is-hidden");
    this.optionsPanel.hidden = true;
    this.optionsPanel.classList.add("is-hidden");
    this.survivalBetPanel.classList.add("is-hidden");
    this.timerPanel.hidden = true;
    this.timerPanel.classList.add("is-hidden");
  }

  openSurvivalBet() {
    this.modesPanel.hidden = true;
    this.modesPanel.classList.add("is-hidden");
    this.survivalBetPanel.hidden = false;
    this.survivalBetPanel.classList.remove("is-hidden");
    this.mainPanel.hidden = true;
    this.mainPanel.classList.add("is-hidden");
    this.pausePanel.hidden = true;
    this.pausePanel.classList.add("is-hidden");
    this.optionsPanel.hidden = true;
    this.optionsPanel.classList.add("is-hidden");
    this.timerPanel.hidden = true;
    this.timerPanel.classList.add("is-hidden");
    this._syncBetPanel();
  }

  showSurvivalBet() {
    this.menu.classList.remove("is-hidden");
    this._pauseOpen = false;
    this.openSurvivalBet();
  }

  openTimer() {
    this.modesPanel.hidden = true;
    this.modesPanel.classList.add("is-hidden");
    this.timerPanel.hidden = false;
    this.timerPanel.classList.remove("is-hidden");
    this.mainPanel.hidden = true;
    this.mainPanel.classList.add("is-hidden");
    this.pausePanel.hidden = true;
    this.pausePanel.classList.add("is-hidden");
    this.survivalBetPanel.hidden = true;
    this.survivalBetPanel.classList.add("is-hidden");
    this.optionsPanel.hidden = true;
    this.optionsPanel.classList.add("is-hidden");
  }

  showMenu() {
    this.menu.classList.remove("is-hidden");
    this._pauseOpen = false;
    this.openMain();
  }

  showTimer() {
    this.menu.classList.remove("is-hidden");
    this._pauseOpen = false;
    this.openTimer();
  }

  hideMenu() {
    this.menu.classList.add("is-hidden");
    this._pauseOpen = false;
  }

  _syncBetPanel() {
    const econ = this.getEconomy ? this.getEconomy() : { bank: 0, bet: 0, min: 0, step: 1 };
    const safeBank = Number.isFinite(econ.bank) ? econ.bank : 0;
    const baseBet = Number.isFinite(econ.bet) ? econ.bet : 0;
    const minDefault = Number.isFinite(econ.min) ? econ.min : 0;
    const stepDefault = Number.isFinite(econ.step) ? econ.step : 1;
    if (this.betBankEl) this.betBankEl.textContent = safeBank;
    if (this.betInput) {
      const min = parseInt(this.betInput.min, 10) || minDefault;
      const step = parseInt(this.betInput.step, 10) || stepDefault;
      const max = Math.max(safeBank, 0);
      this.betInput.max = String(max);
      const current = parseInt(this.betInput.value, 10) || baseBet || min;
      const clamped = Math.max(Math.min(current, max), Math.min(min, max));
      const snapped = Math.round(clamped / step) * step;
      this.betInput.value = String(Math.max(Math.min(snapped, max), Math.min(min, max)));
    }
    this._setBetWarning(safeBank < minDefault);
  }

  _sanitizeBetValue(value) {
    const econ = this.getEconomy ? this.getEconomy() : { bank: 0, bet: 0, min: 0, step: 1 };
    const safeBank = Number.isFinite(econ.bank) ? econ.bank : 0;
    const min = Number.isFinite(econ.min) ? econ.min : 0;
    const step = Number.isFinite(econ.step) ? econ.step : 1;
    const max = Math.max(safeBank, 0);
    const raw = parseInt(value, 10);
    const current = Number.isFinite(raw) ? raw : min;
    const clamped = Math.max(Math.min(current, max), Math.min(min, max));
    const snapped = Math.round(clamped / step) * step;
    return Math.max(Math.min(snapped, max), Math.min(min, max));
  }

  _isBetBlocked() {
    const econ = this.getEconomy ? this.getEconomy() : { bank: 0, min: 0 };
    const min = Number.isFinite(econ.min) ? econ.min : 0;
    const bank = Number.isFinite(econ.bank) ? econ.bank : 0;
    return bank < min;
  }

  _setBetWarning(show) {
    if (!this.betWarningEl) return;
    this.betWarningEl.classList.toggle("is-hidden", !show);
    if (this.betConfirmBtn) this.betConfirmBtn.disabled = show;
  }
}
