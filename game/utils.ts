import { GamePlay } from "./types";

export const createCardPlayedPayload = (
  game: GamePlay,
  playerId: number,
  type: string
) => {
  return {
    type,
    data: {
      currentPlayer: game.currentPlayer,
      playerId,
      players: game.users,
      discardPile: game.discardPile,
    },
  };
};
