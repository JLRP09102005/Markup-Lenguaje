export class MenuManager {
  constructor(audio, onPlay) {
    this.audio = audio;
    this.onPlay = onPlay;
    this.menu = document.getElementById("menu");
    this.mainPanel = document.getElementById("menu-main");
    this.optionsPanel = document.getElementById("menu-options");
    this.playBtn = document.getElementById("menu-play");
    this.optionsBtn = document.getElementById("menu-options-btn");
    this.exitBtn = document.getElementById("menu-exit");
    this.backBtn = document.getElementById("menu-back");
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
    [this.playBtn, this.optionsBtn, this.exitBtn, this.backBtn].forEach((btn) => {
      if (!btn) return;
      btn.addEventListener("mouseenter", () => {
        this.audio.playClick();
      });
    });
    this.playBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      await this.audio.startMusic();
      this.menu.classList.add("is-hidden");
      this.onPlay();
    });
    this.optionsBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.mainPanel.hidden = true;
      this.optionsPanel.hidden = false;
    });
    this.backBtn.addEventListener("click", async () => {
      await this.audio.playClick();
      this.optionsPanel.hidden = true;
      this.mainPanel.hidden = false;
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
      document.body.classList.remove("theme-emerald");
      if (e.target.value === "emerald") {
        document.body.classList.add("theme-emerald");
      }
    });
  }
}
