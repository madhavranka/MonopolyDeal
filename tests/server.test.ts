const http = require('http');
// const express = require('express');
 import { WebSocket } from 'ws';
// const { generateGameId } = require('../utils'); // Import any utility functions you may have

// // Mock WebSocket server
// const mockServer = http.createServer(express());

// // Mock WebSocket client
// const gameServer = new WebSocketServer({server: mockServer});
// const mockClient = new WebSocketServer({ server: mockServer });

// // Mock WebSocket message sending
// mockClient.send = jest.fn();
// gameServer.send = jest.fn();

// // Unit tests for WebSocket server logic
// describe('WebSocket Server', () => {
//     beforeEach(() => {
//         // Clear mock function calls before each test
//         mockClient.send.mockClear();
//     });

//     it('should create a new game when receiving createGame message', () => {
//         const createGameMessage = JSON.stringify({ type: 'createGame' });

//         // Simulate receiving createGame message
//         mockClient.send('message', createGameMessage);

//         // Expect a gameCreated message to be sent back to the client
//         expect(mockClient.send).toHaveBeenCalledWith("message", "{\"type\":\"createGame\"}");
//         expect(gameServer.send).toHaveBeenCalledWith("message","");
//     });

//     it('should allow a player to join an existing game', () => {
//         // Assuming there is an existing game with gameId '123'
//         const joinGameMessage = JSON.stringify({ type: 'joinGame', gameId: '123' });

//         // Simulate receiving joinGame message
//         mockClient.send('message', joinGameMessage);

//         // Expect a playerJoined message to be sent back to the host
//         expect(mockClient.send).toHaveBeenCalledWith("message", "{\"type\":\"joinGame\",\"gameId\":\"123\"}");
//     });

//     it('should start the game when receiving startGame message from the host', () => {
//         const startGameMessage = JSON.stringify({ type: 'startGame', gameId: '456' });
//         mockClient.send('message', startGameMessage);
//         expect(mockClient.send).toHaveBeenCalledWith("message", "{\"type\":\"startGame\",\"gameId\":\"456\"}");
//     });

//     afterAll(() => {
//         mockServer.close();
//     });
// });




// Import the WebSocket server logic
const { handleWebSocketConnections, generateGameId } = require('../utils');

// Mock WebSocketServer and WebSocket
const { WebSocketServer, so } = require('ws');

jest.mock('ws', () => {
  const mockWebSocket = {
    on: jest.fn(),
    send: jest.fn(),
    emit: jest.fn(),
  };

  const mockWebSocketServer = {
    on: jest.fn(),
    emit: jest.fn(),
  };

  return {
    WebSocket: jest.fn(() => mockWebSocket),
    WebSocketServer: jest.fn(() => mockWebSocketServer),
  };
});

describe('WebSocket Server', () => {
  let mockWebSocketServer;

  beforeEach(() => {
    // Clear mock function calls before each test
    jest.clearAllMocks();
    mockWebSocketServer = new WebSocketServer();
  });

  it('should handle connection event', () => {
    // Call the WebSocket connection handler
    handleWebSocketConnections(mockWebSocketServer);

    // Simulate a connection event
    const mockSocket = new so();
    mockWebSocketServer.emit('connection', mockSocket);

    // Expect 'connection' event to be listened to
    expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });

  it('should handle createGame message', () => {
    // Call the WebSocket connection handler
    handleWebSocketConnections(mockWebSocketServer);

    // Simulate a connection event
    const mockSocket = new so();
    mockWebSocketServer.emit('connection', mockSocket);

    // Simulate receiving a 'createGame' message
    const createGameMessage = JSON.stringify({ type: 'createGame' });
    mockSocket.emit('message', createGameMessage);

    // Expect a 'gameCreated' message to be sent back
    expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('gameCreated'));
  });

//   afterAll(() => {
//             mockServer.close();
//         });

  // Write similar tests for other message types (e.g., joinGame, startGame, etc.)
});
