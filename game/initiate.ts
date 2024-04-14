import { Game } from "../server/types";
import { notifyOnePlayer } from "../server/utils";
import { CashPile, GamePlay, Properties } from "./types";

export const createNewGameInstance = (): GamePlay => {
  return {
    playerNames: [],
    host: "",
    playerCards: [],
    lastCard: "",
    currentPlayer: 0,
    users: [],
    discardPile: [],
    schemaArray: [
      // Rent cards
      "rent-twoColored-darkBlueAndGreen",
      "rent-twoColored-darkBlueAndGreen",
      "rent-twoColored-lightGreenAndBlack",
      "rent-twoColored-lightGreenAndBlack",
      "rent-twoColored-lightBlueAndBrown",
      "rent-twoColored-lightBlueAndBrown",
      "rent-twoColored-orangeAndPink",
      "rent-twoColored-orangeAndPink",
      "rent-twoColored-redAndYellow",
      "rent-twoColored-redAndYellow",
      "rent-multiColored",
      "rent-multiColored",
      "rent-multiColored",
      // Cash cards
      "cash-ten",
      "cash-five",
      "cash-five",
      "cash-four",
      "cash-four",
      "cash-four",
      "cash-three",
      "cash-three",
      "cash-three",
      "cash-two",
      "cash-two",
      "cash-two",
      "cash-two",
      "cash-two",
      "cash-one",
      "cash-one",
      "cash-one",
      "cash-one",
      "cash-one",
      "cash-one",
      // Property cards
      "property-darkBlue",
      "property-darkBlue",
      "property-green",
      "property-green",
      "property-green",
      "property-red",
      "property-red",
      "property-red",
      "property-yellow",
      "property-yellow",
      "property-yellow",
      "property-orange",
      "property-orange",
      "property-orange",
      "property-pink",
      "property-pink",
      "property-pink",
      "property-black",
      "property-black",
      "property-black",
      "property-black",
      "property-brown",
      "property-brown",
      "property-lightGreen",
      "property-lightGreen",
      "property-lightBlue",
      "property-lightBlue",
      "property-lightBlue",
      // Wild cards
      "wild-multiColored",
      "wild-multiColored",
      "wild-darkBlueAndGreen",
      "wild-lightBlueAndBrown",
      "wild-orangeAndPink",
      "wild-orangeAndPink",
      "wild-greenAndBlack",
      "wild-lightBlueAndBlack",
      "wild-redAndYellow",
      "wild-redAndYellow",
      "wild-lightGreenAndBlack",
      // Action cards
      "action-dealBreaker",
      "action-dealBreaker",
      "action-justSayNo",
      "action-justSayNo",
      "action-justSayNo",
      "action-slyDeal",
      "action-slyDeal",
      "action-slyDeal",
      "action-forcedDeal",
      "action-forcedDeal",
      "action-forcedDeal",
      "action-forcedDeal",
      "action-debtCollector",
      "action-debtCollector",
      "action-debtCollector",
      "action-itsMyBirthday",
      "action-itsMyBirthday",
      "action-itsMyBirthday",
      "action-passGo",
      "action-passGo",
      "action-passGo",
      "action-passGo",
      "action-passGo",
      "action-passGo",
      "action-passGo",
      "action-passGo",
      "action-passGo",
      "action-passGo",
      "action-house",
      "action-house",
      "action-house",
      "action-hotel",
      "action-hotel",
      "action-hotel",
      "action-doubleTheRent",
      "action-doubleTheRent",
    ],
  };
};

export const shuffleCards = (game: GamePlay) => {
  for (let i = game.schemaArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = game.schemaArray[j];
    game.schemaArray[j] = game.schemaArray[i];
    game.schemaArray[i] = temp;
  }
};

export const distributeCards = (game: GamePlay) => {
  for (let i = 0; i < game.playerNames.length * 5; i++) {
    if (!game.playerCards[i % game.playerNames.length]) {
      game.playerCards[i % game.playerNames.length] = [];
    }
    game.playerCards[i % game.playerNames.length].push(game.schemaArray[0]);
    game.schemaArray.shift();
  }
};

export const assignPlayers = (game: GamePlay) => {
  for (let i = 0; i < game.playerCards.length; i++) {
    game.users[i] = {
      playerId: i,
      playerName: game.playerNames[i],
      cards: game.playerCards[i],
      cashPile: createCashPile(),
      properties: createPropertyPile(),
      totalCash: 0,
      cardsPlayed: 0,
      receivedCards: [],
    };
  }
};

export const convertDiscardedPileToDrawPile = (game: GamePlay) => {
  game.schemaArray = [...game.discardPile];
  shuffleCards(game);
};

const createCashPile = (): CashPile => {
  return {
    ten: 0,
    five: 0,
    four: 0,
    three: 0,
    two: 0,
    one: 0,
  };
};

const createPropertyPile = (): Properties => {
  return {
    darkBlue: [],
    green: [],
    red: [],
    yellow: [],
    black: [],
    lightGreen: [],
    lightBlue: [],
    orange: [],
    pink: [],
    brown: [],
  };
};

export const notifyTheStart = (currentGame: Game) => {
  for (let i = 0; i < currentGame.game.playerNames.length; i++) {
    notifyOnePlayer(
      currentGame,
      {
        type: "gameStarted",
        data: {
          cards: currentGame.game.playerCards[i],
          currentPlayer: currentGame.game.currentPlayer,
        },
      },
      i
    );
  }
};
