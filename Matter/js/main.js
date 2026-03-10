import { Game } from "./Game.js";

const root = document.getElementById("game");
const game = new Game(root, window.Matter);
game.start();
