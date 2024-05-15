import { Game } from "../server/types";
import {
  shuffleCards,
  distributeCards,
  assignPlayers,
  notifyTheStart,
} from "./initiate";
import { drawCards } from "./play";

export const startTheGame = (currentGame: Game) => {
  shuffleCards(currentGame.game);
  distributeCards(currentGame.game);
  assignPlayers(currentGame.game);
  drawCards(currentGame.game);
  notifyTheStart(currentGame);
};
