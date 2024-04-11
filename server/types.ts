import { WebSocket } from "ws";

export type Game = {
  host: WebSocket;
  players: WebSocket[];
  id: string;
};
