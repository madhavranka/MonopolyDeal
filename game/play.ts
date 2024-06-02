import { mutex } from "../server/server";
import { Game } from "../server/types";
import { notifyAllPlayers, notifyOnePlayer } from "../server/utils";
import { convertDiscardedPileToDrawPile } from "./initiate";
import { message, sanitizeMessage } from "./message";
import { Cash, GamePlay, Property } from "./types";
import { createCardPlayedPayload } from "./utils";

export const play = async (currentGame: Game, turnData) => {
  if (turnData.action === "discard") {
    playDiscard(turnData, currentGame);
  } else if (turnData.action === "act") {
    playAct(turnData, currentGame);
  } else if (turnData.action === "receive") {
    playReceive(turnData, currentGame);
  } else if (turnData.action === "rearrange") {
    playRearrange(turnData, currentGame);
  } else {
    playGame(turnData, currentGame);
  }
};

const playDiscard = (turnData, currentGame: Game) => {
  currentGame.game.discardPile.push(turnData.card);
  removeCardFromPlayingSet(turnData.card, currentGame.game);
  notifyAllPlayers(currentGame, {
    type: "cardDiscarded",
    turnData: { card: turnData.card },
  });
};

const playAct = async (turnData, currentGame: Game) => {
  await actOnAction(turnData, currentGame);
  notifyAllPlayers(currentGame, {
    type: "playerActed",
    data: {
      receiver: currentGame.game["currentPlayer"],
      playerId: turnData.playerId,
    },
  });
};

const playReceive = async (turnData, currentGame: Game) => {
  await depositProperty(turnData, currentGame.game);
  notifyAllPlayers(currentGame, {
    type: "propertyReceived",
    data: {
      receiver: turnData.playerId,
      properties: currentGame.game?.["users"][turnData.playerId].properties,
    },
  });
};

const playRearrange = (turnData, currentGame) => {
  const game = currentGame.game;
  if (game) {
    if (turnData.playerId === game.currentPlayer) {
      game.users[game.currentPlayer].properties = turnData.properties;
      notifyAllPlayers(currentGame, {
        type: "propertyRearranged",
        data: {
          properties: game.users[game.currentPlayer].properties,
        },
      });
    } else {
      notifyOnePlayer(
        currentGame,
        {
          type: "cantRearrange",
          message: "You can only rearrange cards in your turn",
        },
        game.currentPlayer
      );
    }
  }
};

const playGame = (turnData, currentGame) => {
  const playerName: string = turnData.playerName;
  const game: GamePlay = currentGame.game;
  if (game) {
    if (game.currentPlayer === game.playerNames.indexOf(playerName)) {
      game.currentPlayer = game.playerNames.indexOf(playerName);
      if (game.users[game.currentPlayer].cardsPlayed === 3) {
        notifyOnePlayer(
          currentGame,
          { type: "maxCardLimit" },
          game.currentPlayer
        );
      } else {
        console.log(turnData);
        playTurn(turnData, currentGame);
        game.lastCard = turnData.card;
        for (let i = 0; i < game.playerNames.length; i++) {
          notifyOnePlayer(
            currentGame,
            createCardPlayedPayload(game, i, "cardPlayed"),
            i
          );
        }
      }
    }
  }
};

export const drawCards = (game: GamePlay) => {
  if (
    game.playerCards[game.currentPlayer].length < 1 &&
    game.lastCard !== "action-passGo"
  ) {
    for (let i = 0; i < 5; i++) {
      if (game.schemaArray.length < 1) {
        convertDiscardedPileToDrawPile(game);
      }
      game.playerCards[game.currentPlayer].push(game.schemaArray[0]);
      game.schemaArray.shift();
    }
  } else {
    for (let i = 0; i < 2; i++) {
      if (game.schemaArray.length < 1) {
        convertDiscardedPileToDrawPile(game);
      }
      game.playerCards[game.currentPlayer].push(game.schemaArray[0]);
      game.schemaArray.shift();
    }
  }
};

const playTurn = (turnData, currentGame: Game) => {
  const useAsCash: boolean = turnData.useAsCash;
  console.log(`type is ${typeof turnData.useAsCash} useAsCash is ${useAsCash}`);
  const playedCardArray = turnData.card.split("-");
  if (
    useAsCash &&
    playedCardArray[0] !== "property" &&
    playedCardArray[0] !== "wild"
  ) {
    playedCardArray[0] = "cash";
  }
  switch (playedCardArray[0]) {
    case "cash":
      const amount = useAsCash ? turnData.amount : playedCardArray[1];
      playCashCard(amount, turnData.card, currentGame.game);
      //add one dollar to the cash pile of current player
      break;

    case "rent":
      playRentCard(turnData, playedCardArray[1], currentGame);
      break;

    case "property":
      playPropertyCard(turnData, playedCardArray[1], currentGame.game);
      break;

    case "wild":
      const color = turnData.color;
      playWildPropertyCard(turnData.card, color, currentGame.game);
      break;

    case "action":
      playActionCard(turnData, currentGame);
      break;

    default:
      break;
  }
  currentGame.game.users[currentGame.game.currentPlayer].cardsPlayed++;
};

const playCashCard = (amount: string, cardName: string, game: GamePlay) => {
  game.users[game.currentPlayer].cashPile[amount]++;
  removeCardFromPlayingSet(cardName, game);
  game.users[game.currentPlayer].totalCash += amountStringToNumber(
    amount as unknown as Cash
  );
};

export const changeTurn = (game: GamePlay): boolean => {
  if (game.users[game.currentPlayer].cards.length > 7) {
    return false;
  } else {
    game.users[game.currentPlayer].cardsPlayed = 0;
    if (game.currentPlayer === game.playerNames.length - 1) {
      game.currentPlayer = 0;
    } else {
      game.currentPlayer++;
    }
    drawCards(game);
    return true;
  }
};

function amountStringToNumber(amount: Cash): number {
  const amountToString = {
    ten: 10,
    five: 5,
    four: 4,
    three: 3,
    two: 2,
    one: 1,
  };
  return amountToString[amount] ?? 0;
}

const playPropertyCard = (turnData, color: string, game: GamePlay) => {
  addPropertyCard(turnData.pileIndex, color, game);
  removeCardFromPlayingSet(`property-${color}`, game);
};

const addPropertyCard = (
  pileIndex: number | undefined,
  color: string,
  game: GamePlay
) => {
  if (
    game.users[game.currentPlayer].properties[color].length === 0 ||
    !game.users[game.currentPlayer].properties[color][pileIndex]
  ) {
    const property: Property = {
      color: color,
      numberOfCards: 1,
      numberOfHouse: 0,
      numberOfHotel: 0,
      isCompleteSet: false,
      wildCards: [],
    };
    game.users[game.currentPlayer].properties[color].push(property);
  } else {
    game.users[game.currentPlayer].properties[color][pileIndex].numberOfCards++;
  }
};

const playWildPropertyCard = (
  card: string,
  wildPropertyColor: string,
  game: GamePlay,
  pileIndex: number = 0
) => {
  addWildPropertyCard(
    wildPropertyColor,
    card,
    pileIndex,
    game.currentPlayer,
    game
  );
  removeCardFromPlayingSet(card, game);
};

const addWildPropertyCard = (
  wildPropertyColor: string,
  card: string,
  pileIndex: number,
  playerId: number,
  game: GamePlay
) => {
  if (game.users[playerId].properties[wildPropertyColor].length === 0) {
    const property: Property = {
      color: wildPropertyColor,
      numberOfCards: 1,
      numberOfHouse: 0,
      numberOfHotel: 0,
      isCompleteSet: false,
      wildCards: [card],
    };
    game.users[playerId].properties[wildPropertyColor].push(property);
  } else {
    game.users[playerId].properties[wildPropertyColor][pileIndex]
      .numberOfCards++;
    game.users[playerId].properties[wildPropertyColor][
      pileIndex
    ].wildCards.push(card);
  }
};

const playRentCard = (turnData, rentLabel: string, currentGame: Game) => {
  currentGame.game.discardPile.push(turnData.card);
  const playedWithDoubleRent = turnData.playedWithDoubleRent;
  removeCardFromPlayingSet(turnData.card, currentGame.game);
  if (playedWithDoubleRent) {
    currentGame.game.users[currentGame.game.currentPlayer].cardsPlayed++;
    removeCardFromPlayingSet(`action-doubleTheRent`, currentGame.game);
  }
  let response;
  if (rentLabel === "multiColored") {
    response = {
      type: "collectRent",
      message: sanitizeMessage(message.SINGLE_PLAYER_RENT, {
        receiver: currentGame.game.playerNames[currentGame.game.currentPlayer],
        playerToAct: currentGame.game.playerNames[turnData.playerToAct],
        amount: calculateRentAmount(
          turnData.color,
          currentGame.game.users[currentGame.game.currentPlayer].properties[
            turnData.color
          ]
        ),
      }),
    };
    notifyOnePlayer(currentGame, response, turnData.playerToAct);
  } else {
    response = {
      type: "collectRent",
      message: sanitizeMessage(message.ALL_PLAYER_RENT, {
        receiver: currentGame.game.playerNames[currentGame.game.currentPlayer],
        amount: calculateRentAmount(
          turnData.color,
          currentGame.game.users[currentGame.game.currentPlayer].properties[
            turnData.color
          ]
        ),
      }),
    };
    notifyAllPlayers(currentGame, response);
  }
};

const calculateRentAmount = (color: string, properties: Property[]): number => {
  const completeRent = {
    darkBlue: 8,
    green: 7,
    red: 6,
    yellow: 6,
    black: 4,
    lightGreen: 2,
    lightBlue: 3,
    orange: 5,
    pink: 4,
    brown: 2,
  };

  const singleRent = {
    darkBlue: 3,
    green: 2,
    red: 2,
    yellow: 2,
    black: 1,
    lightGreen: 1,
    lightBlue: 1,
    orange: 1,
    pink: 1,
    brown: 1,
  };
  let value: number = 0;
  properties.forEach((property) => {
    value += property.isCompleteSet
      ? completeRent[color]
      : property.numberOfCards * singleRent[color];
    value += property.numberOfHouse * 3 + property.numberOfHotel * 4;
  });
  return value;
};

const playActionCard = (turnData, currentGame: Game) => {
  const action = turnData.card.split("-")[1];
  const playerToAct = turnData.playerToAct;
  let response = {};
  switch (action) {
    case "dealBreaker":
      notifyOnePlayer(
        currentGame,
        {
          type: "dealBreaker",
          message: sanitizeMessage(message.DEAL_BREAKER, {
            receiver:
              currentGame.game.playerNames[currentGame.game.currentPlayer],
            playerToAct: currentGame.game.playerNames[playerToAct],
            color: turnData.color,
          }),
          data: { color: turnData.color },
        },
        playerToAct
      );
    case "slyDeal":
      response = {
        type: action,
        message: sanitizeMessage(message.SLY_DEAL, {
          receiver:
            currentGame.game.playerNames[currentGame.game.currentPlayer],
          playerToAct: currentGame.game.playerNames[playerToAct],
          takeCard: turnData.takeCard,
        }),
        data: {
          takeCard: turnData.takeCard,
        },
      };
      notifyOnePlayer(currentGame, response, turnData.playerToAct);
    case "forcedDeal":
      response = {
        type: action,
        message: sanitizeMessage(message.FORCED_DEAL, {
          receiver:
            currentGame.game.playerNames[currentGame.game.currentPlayer],
          playerToAct: currentGame.game.playerNames[playerToAct],
          takeCard: turnData.takeCard,
          giveCard: turnData.giveCard,
        }),
        data: {
          giveCard: turnData.giveCard,
          takeCard: turnData.takeCard,
        },
      };
      notifyOnePlayer(currentGame, response, turnData.playerToAct);
    case "debtCollector":
      response = {
        type: action,
        message: sanitizeMessage(message.DEBT_COLLECTOR, {
          receiver:
            currentGame.game.playerNames[currentGame.game.currentPlayer],
          playerToAct: currentGame.game.playerNames[playerToAct],
        }),
      };
      notifyOnePlayer(currentGame, response, turnData.playerToAct);
      break;
    case "itsMyBirthday":
      //let everyone know and wait for everyone to pay to the requestor till the next move is allowed
      notifyAllPlayers(currentGame, {
        type: "birthday",
        message: sanitizeMessage(message.ITS_MY_BIRTHDAY, {
          receiver:
            currentGame.game.playerNames[currentGame.game.currentPlayer],
        }),
      });
      break;

    case "passGo":
      currentGame.game.lastCard = turnData.card;
      drawCards(currentGame.game);
      break;

    case "house":
      addHouseOrHotelToAPropertySet(turnData, currentGame.game);
      break;
    case "hotel":
      addHouseOrHotelToAPropertySet(turnData, currentGame.game, true);
      break;
    default:
      break;
  }
  currentGame.game.discardPile.push(turnData.card);
  removeCardFromPlayingSet(turnData.card, currentGame.game);
};

const addHouseOrHotelToAPropertySet = (
  turnData,
  game: GamePlay,
  isHotel: boolean = false
) => {
  const color: string = turnData.color;
  const pileIndex: number = turnData.pileIndex ?? 0;
  isHotel
    ? game.users[game.currentPlayer].properties[color][pileIndex]
        .numberOfHotel++
    : game.users[game.currentPlayer].properties[color][pileIndex]
        .numberOfHouse++;
  removeCardFromPlayingSet(turnData.card, game);
};

const removeCardFromPlayingSet = (cardName: string, game: GamePlay) => {
  const cardIndex = game.users[game.currentPlayer].cards.indexOf(cardName);
  game.users[game.currentPlayer].cards.splice(cardIndex, 1);
};

const removeCardFromPlayer = (turnData, game: GamePlay) => {
  const properties: { [x: string]: string[][] } = turnData.properties;
  const playerId: string = turnData.playerId;
  //remove card from property object and not cards object
  for (const color in properties) {
    const propertyArray: string[][] = properties[color];
    for (let i = 0; i < propertyArray.length; i++) {
      const propertyPile: string[] = propertyArray[i];
      propertyPile.forEach((card) => {
        if (card === `property-${color}`) {
          game.users[playerId].properties[color][i].numberOfCards--;
        } else {
          const cardIndex =
            game.users[playerId].properties[color][i].wildCards.indexOf(card);
          if (cardIndex > -1) {
            game.users[playerId].properties[color][i].wildCards.splice(
              cardIndex,
              1
            );
            game.users[playerId].properties[color][i].numberOfCards--;
          }
        }
      });
    }
  }
};

const actOnAction = async (turnData, currentGame: Game) => {
  const release = await mutex.acquire();
  try {
    await processJustSayNo(turnData, currentGame);
    await processCash(turnData, currentGame.game);
    await processProperty(turnData, currentGame.game);
  } finally {
    release();
  }
};

const processCash = async (turnData, game: GamePlay) => {
  const playerId: number = turnData.playerId;
  const cashArray: string[] = turnData.cash;
  cashArray?.forEach((cash) => {
    game.users[game.currentPlayer].cashPile[cash]++;
    game.users[game.currentPlayer].totalCash += amountStringToNumber(
      cash as unknown as Cash
    );
    game.users[playerId].cashPile[cash]--;
    game.users[playerId].totalCash -= amountStringToNumber(
      cash as unknown as Cash
    );
  });
};

const processProperty = async (turnData, game: GamePlay) => {
  if (turnData.properties) {
    await receiveProperty(turnData.properties, game);
    removeCardFromPlayer(turnData, game);
  }
};

const receiveProperty = async (
  properties: { [x: string]: string[][] },
  game: GamePlay
) => {
  for (const color in properties) {
    const propertyArray: string[][] = properties[color];
    for (let i = 0; i < propertyArray.length; i++) {
      const propertyPile: string[] = propertyArray[i];
      propertyPile.forEach((card) => {
        game.users[game.currentPlayer].receivedCards.push(card);
      });
    }
  }
};

const processJustSayNo = async (turnData, currentGame: Game) => {
  const playerId: number = turnData.playerId;
  const justSayNo: boolean | undefined = turnData.justSayNo;
  if (justSayNo) {
    const cardIndex: number =
      currentGame.game.users[playerId].cards.indexOf(`action-justSayNo`);
    if (cardIndex > -1) {
      currentGame.game.users[playerId].cards.splice(cardIndex, 1);
    } else {
      notifyOnePlayer(
        currentGame,
        { type: "invalidMove", message: "You don't have just say no!" },
        playerId
      );
    }
  }
};

const depositProperty = async (turnData, game: GamePlay) => {
  const properties: { [x: string]: string[][] } = turnData.properties;
  const playerId: number = turnData.playerId;
  for (const color in properties) {
    const propertyArray: string[][] = properties[color];
    for (let i = 0; i < propertyArray.length; i++) {
      const propertyPile: string[] = propertyArray[i];
      propertyPile.forEach((card) => {
        if (card === `property-${color}`) {
          addPropertyCard(i, color, game);
        } else {
          addWildPropertyCard(color, card, i, playerId, game);
        }
      });
    }
  }
};
