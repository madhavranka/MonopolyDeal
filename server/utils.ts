import { Game } from "./types";

export function generateGameId() {
  // Generate a unique game ID (e.g., UUID)
  return Math.random().toString(36).substring(2, 15);
}

export function notifyAllPlayers(currentGame: Game, message) {
  currentGame.players.forEach((player) => player.send(JSON.stringify(message)));
}

export function notifyOnePlayer(currentGame: Game, message, playerId: number) {
  currentGame.players[playerId].send(JSON.stringify(message));
}
