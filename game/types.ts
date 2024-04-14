export enum Cash {
  ten,
  five,
  four,
  three,
  two,
  one,
}

export type Property = {
  color: string;
  numberOfCards: number;
  numberOfHouse: number;
  numberOfHotel: number;
  isCompleteSet: boolean;
  wildCards: string[];
};

export type CashPile = {
  ten: number;
  five: number;
  four: number;
  three: number;
  two: number;
  one: number;
};

export type Properties = {
  darkBlue: string[][];
  green: string[][];
  red: string[][];
  yellow: string[][];
  black: string[][];
  lightGreen: string[][];
  lightBlue: string[][];
  orange: string[][];
  pink: string[][];
  brown: string[][];
};

export type Player = {
  playerId: number;
  cards: string[];
  playerName: string;
  cashPile: CashPile;
  properties: Properties;
  totalCash: number;
  cardsPlayed: number;
  receivedCards: string[];
};

export type GamePlay = {
  playerNames: string[];
  host: string;
  playerCards: string[][];
  lastCard: string;
  currentPlayer: number;
  users: Player[];
  discardPile: string[];
  schemaArray: string[];
};
