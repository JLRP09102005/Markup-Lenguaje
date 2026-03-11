import { Game } from "./Game.js";
import { AudioManager } from "./AudioManager.js";
import { MenuManager } from "./MenuManager.js";
import { ResultsManager } from "./ResultsManager.js";
import { SurvivalResultsManager } from "./SurvivalResultsManager.js";

window.__pachinkoBooting = true;

async function resolveMatter() {
  if (window.Matter) return window.Matter;
  try {
    const mod = await import("https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm");
    return mod.default || mod;
  } catch (error) {
    // Fallback message for local file or blocked module import.
    console.error("Matter.js no disponible", error);
    return null;
  }
}

const root = document.getElementById("game");
const audio = new AudioManager();
resolveMatter().then((matter) => {
  if (!matter) return;
  const game = new Game(root, matter, audio);
  const results = new ResultsManager(
    () => menu.showTimer(),
    () => menu.showMenu()
  );
  results.init();
  const survivalResults = new SurvivalResultsManager(
    () => menu.showSurvivalBet(),
    () => menu.showMenu()
  );
  survivalResults.init();
  const menu = new MenuManager(
    audio,
    () => game.start(),
    () => game.applyTheme(),
    (mode, options) => game.setMode(mode, options),
    () => ({
      bank: game.state.bank,
      bet: game.state.bet,
      min: game.config.betMin,
      step: game.config.betStep,
    })
  );
  menu.init();
  game.onTimerEnd = (score, duration) => results.show(score, duration);
  game.onSurvivalEnd = (rounds) => survivalResults.show(rounds);
  window.__pachinkoStarted = true;
});
