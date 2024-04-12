import { WebSocket } from "ws";
import { GamePlay } from "../game/types";

export type Game = {
  host: WebSocket;
  players: WebSocket[];
  id: string;
  game?: GamePlay | {};
};
