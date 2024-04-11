// server.js
const http = require("http");
const express = require("express");
import { WebSocket, WebSocketServer } from "ws";
import { generateGameId, notifyAllPlayers } from "./utils";
import { game } from "../game/initiate";
import { startTheGame } from "../game/main";
import { changeTurn, play } from "../game/play";
import { Mutex } from "async-mutex";
import { Game } from "./types";

const app = express();
const server = http.createServer(app);
const socket = new WebSocketServer({ server });

const BASE_URL = "http://example.com/game/";
const PORT = process.env.PORT || 3000;
let MAX_PLAYERS = 2;
let MIN_PLAYERS = 2;

export const games = {};
const liveGames = {};
export const mutex = new Mutex();

// // Serve static files (e.g., your game client)
// app.use(express.static("public"));

// app.get("/", function (req, res) {
//   res.sendFile("/Users/madhavranka/Workspace/MonopolyDeal/client/index.html");
// });

// Handle WebSocket connections
socket.on("connection", async (socket: WebSocket) => {
  console.log("A user connected");

  // Handle incoming messages from clients
  socket.on("message", async (message: string | Buffer) => {
    console.log("Received message:", message.toString());
    await handleMessage(socket, message);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const handleMessage = async (socket: WebSocket, message: string | Buffer) => {
  try {
    const data = JSON.parse(message.toString());

    // Check the message type
    switch (data.type) {
      case "createGame":
        createGame(socket, data);
        break;
      case "joinGame":
        joinGame(socket, data);
        break;
      case "startGame":
        startGame(socket, data);
        break;

      case "playTurn":
        playTurn(socket, data);
        break;

      case "pass":
        pass(socket, data);
        break;

      default:
        socket.send(JSON.stringify({ type: "invalidType" }));
        break;

      // Handle other message types as needed
    }
  } catch (error) {
    console.log(error);
  }
  //   console.log(JSON.stringify(game));
  // Broadcast the message to all connected clients (excluding the sender)
  // socket.send('message', data);
};

const createGame = async (
  socket: WebSocket,
  data: { playerName: string; gameId: string | undefined }
) => {
  // Create a new game and assign the host
  if (data.playerName) {
    const gameId =
      data.gameId && !games[data.gameId] ? data.gameId : generateGameId();
    games[gameId] = {
      host: socket,
      players: [socket],
      id: gameId,
    };
    game.playerNames.push(data.playerName);
    game.host = data.playerName;
    // Send the game URL to the host
    socket.send(
      JSON.stringify({
        type: "gameCreated",
        gameUrl: `${BASE_URL}${gameId}`,
      })
    );
  } else {
    socket.send(JSON.stringify({ type: "missingHostName" }));
  }
};

const joinGame = async (
  socket: WebSocket,
  data: { gameId: string; playerName: string }
) => {
  // Join an existing game using the provided game ID
  const joinGameId = data.gameId;
  const gameToJoin = games[joinGameId];
  if (gameToJoin?.players?.length === MAX_PLAYERS) {
    socket.send(JSON.stringify({ type: "maxLimitReached" }));
  } else if (gameToJoin && gameToJoin.host !== socket && data.playerName) {
    // Add the player to the game if it exists and it's not the host
    gameToJoin.players.push(socket);
    game.playerNames.push(data.playerName);
    // Send a message to the host to indicate a new player joined
    gameToJoin.host.send(
      JSON.stringify({
        type: "playerJoined",
        data: { player: data.playerName },
      })
    );
    socket.send(
      JSON.stringify({
        type: "playerJoined",
        data: { player: data.playerName },
      })
    );
  } else {
    // Inform the player that the game does not exist or they cannot join
    socket.send(JSON.stringify({ type: "invalidGameId" }));
  }
};

const startGame = async (socket: WebSocket, data: { gameId: any }) => {
  // Start the game (only the host can start the game)
  const startGameId = data.gameId;
  const gameToStart: Game = games[startGameId];
  if (
    gameToStart &&
    socket === gameToStart.host &&
    gameToStart.players.length >= MIN_PLAYERS &&
    !liveGames[startGameId]
  ) {
    // Send a message to all players to start the game
    startTheGame(gameToStart);
    liveGames[startGameId] = true;
  } else {
    socket.send(JSON.stringify({ type: "notHost" }));
  }
};

const playTurn = async (
  socket: WebSocket,
  data: {
    playerName: string;
    turnData: any;
    gameId: string;
  }
) => {
  const gameId = data.gameId;
  const currentGame: Game | undefined = games[gameId];
  if (currentGame) {
    const turnData = data.turnData;
    console.log(`player ${data.playerName} played with turnData ${turnData}`);
    await play(currentGame, turnData);
  } else {
    socket.send(JSON.stringify({ type: "invalidGameId" }));
  }
};

const pass = async (socket: WebSocket, data: { gameId: string }) => {
  const gameId = data.gameId;
  const currentGame: Game | undefined = games[gameId];
  if (currentGame) {
    const turnChanged: boolean = changeTurn();
    if (turnChanged) {
      notifyAllPlayers(currentGame, {
        type: "turnChange",
        data: { currentPlayer: game.currentPlayer },
      });
    } else {
      socket.send(JSON.stringify({ type: "invalidPass" }));
    }
  } else {
    socket.send(JSON.stringify({ type: "invalidGameId" }));
  }
};

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
