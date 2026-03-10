import { Game } from "./Game.js";

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
resolveMatter().then((matter) => {
  if (!matter) return;
  const game = new Game(root, matter);
  game.start();
  window.__pachinkoStarted = true;
});
