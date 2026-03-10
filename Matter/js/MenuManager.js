export class MenuManager {
  constructor(audio, onPlay, onThemeChange, onModeSelect) {
    this.audio = audio;
    this.onPlay = onPlay;
    this.onThemeChange = onThemeChange;
    this.onModeSelect = onModeSelect;
    this.menu = document.getElementById("menu");
    this.mainPanel = document.getElementById("menu-main");
    this.optionsPanel = document.getElementById("menu-options");
    this.modesPanel = document.getElementById("menu-modes");
    this.timerPanel = document.getElementById("menu-timer");
    this.playBtn = document.getElementById("menu-play");
    this.optionsBtn = document.getElementById("menu-options-btn");
    this.exitBtn = document.getElementById("menu-exit");
    this.backBtn = document.getElementById("menu-back");
    this.modeSurvivalBtn = document.getElementById("mode-survival");
    this.modeTimerBtn = document.getElementById("mode-timer");
    this.modeBackBtn = document.getElementById("mode-back");
    this.timerSeconds = document.getElementById("timer-seconds");
    this.timerStartBtn = document.getElementById("timer-start");
    this.timerBackBtn = document.getElementById("timer-back");
    this.musicRange = document.getElementById("opt-music");
    this.sfxRange = document.getElementById("opt-sfx");
    this.toggleGlow = document.getElementById("opt-glow");
    this.toggleMotion = document.getElementById("opt-motion");
    this.themeSelect = document.getElementById("opt-theme");
  }
  init() {
    this.menu.classList.remove("is-hidden");
    this.mainPanel.hidden = false;
    this.optionsPanel.hidden = true;
    this.optionsPanel.classList.add("is-hidden");
    this.modesPanel.hidden = true;
    this.modesPanel.classList.add("is-hidden");
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
    this.backBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.openMain();
    });
    this.modeBackBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.openMain();
    });
    this.timerBackBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.openModes();
    });
    this.modeSurvivalBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      await this.audio.startMusic();
      this.menu.classList.add("is-hidden");
      if (this.onModeSelect) this.onModeSelect("survival");
      this.onPlay();
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
        this.openOptions();
        return;
      }
      if (!this.optionsPanel.hidden) {
        this.menu.classList.add("is-hidden");
        return;
      }
      this.menu.classList.add("is-hidden");
    });
  }

  openOptions() {
    this.mainPanel.hidden = true;
    this.optionsPanel.hidden = false;
    this.mainPanel.classList.add("is-hidden");
    this.optionsPanel.classList.remove("is-hidden");
    this.modesPanel.hidden = true;
    this.modesPanel.classList.add("is-hidden");
    this.timerPanel.hidden = true;
    this.timerPanel.classList.add("is-hidden");
  }

  openMain() {
    this.optionsPanel.hidden = true;
    this.mainPanel.hidden = false;
    this.optionsPanel.classList.add("is-hidden");
    this.mainPanel.classList.remove("is-hidden");
    this.modesPanel.hidden = true;
    this.modesPanel.classList.add("is-hidden");
    this.timerPanel.hidden = true;
    this.timerPanel.classList.add("is-hidden");
  }

  openModes() {
    this.mainPanel.hidden = true;
    this.modesPanel.hidden = false;
    this.mainPanel.classList.add("is-hidden");
    this.modesPanel.classList.remove("is-hidden");
    this.optionsPanel.hidden = true;
    this.optionsPanel.classList.add("is-hidden");
    this.timerPanel.hidden = true;
    this.timerPanel.classList.add("is-hidden");
  }

  openTimer() {
    this.modesPanel.hidden = true;
    this.modesPanel.classList.add("is-hidden");
    this.timerPanel.hidden = false;
    this.timerPanel.classList.remove("is-hidden");
    this.mainPanel.hidden = true;
    this.mainPanel.classList.add("is-hidden");
    this.optionsPanel.hidden = true;
    this.optionsPanel.classList.add("is-hidden");
  }

  showMenu() {
    this.menu.classList.remove("is-hidden");
    this.openMain();
  }

  showTimer() {
    this.menu.classList.remove("is-hidden");
    this.openTimer();
  }
}
