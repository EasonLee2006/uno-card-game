"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const UnoGame_1 = require("./UnoGame");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const PORT = 3000;
app.use(express_1.default.static("public"));
// NEW: The Room Manager. A dictionary of active games.
const activeRooms = new Map();
io.on("connection", (socket) => {
    console.log(`User connected. Socket ID: ${socket.id}`);
    // --- STEP 1: Joining a Lobby ---
    socket.on("joinRoom", (data) => {
        const roomCode = data.roomCode.toUpperCase();
        // 1. Check if room exists. If not, create it.
        let game = activeRooms.get(roomCode);
        if (!game) {
            game = new UnoGame_1.UnoGame();
            activeRooms.set(roomCode, game);
            console.log(`Room ${roomCode} created!`);
        }
        // 2. Magic Socket.io Command: Put this socket into a dedicated channel
        socket.join(roomCode);
        // 3. Add player to the game logic
        game.addPlayer(socket.id, data.name);
        // 4. Remember what room this socket is in for future requests
        socket.data.roomCode = roomCode;
        console.log(`${data.name} joined room ${roomCode}`);
        // 5. Broadcast updated lobby data to EVERYONE IN THIS SPECIFIC ROOM ONLY
        io.to(roomCode).emit("lobbyUpdated", game.getLobbyData());
    });
    // --- Disconnect Handling ---
    socket.on("disconnect", () => {
        const roomCode = socket.data.roomCode;
        if (roomCode) {
            const game = activeRooms.get(roomCode);
            if (game) {
                game.removePlayer(socket.id); // Remove from game logic
                // If room is empty, delete it from the server memory!
                if (game.turnOrder.length === 0) {
                    activeRooms.delete(roomCode);
                    console.log(`Room ${roomCode} is empty, deleted.`);
                }
                else {
                    // Tell remaining players someone left
                    io.to(roomCode).emit("lobbyUpdated", game.getLobbyData());
                    console.log(`${socket.id} disconnected`);
                }
            }
        }
    });
    socket.on("startGame", () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode)
            return;
        const game = activeRooms.get(roomCode);
        // Security check: Only the host can start the game!
        if (game && game.players[socket.id]?.isHost) {
            game.startGame();
            // 1. Broadcast to everyone in the room that the game is on
            io.to(roomCode).emit("gameStarted", {
                tableCards: game.tableCards,
                activePlayerID: game.getActivePlayerID(),
                players: game.getLobbyData().players // Send player names for the UI
            });
            // 2. Send each player their specific, private hand
            game.turnOrder.forEach(playerId => {
                io.to(playerId).emit("yourHand", game.players[playerId].hand);
            });
        }
    });
    socket.on("playCardRequest", (cards) => {
        // TODO: handle multi card play in 1 round
        const roomCode = socket.data.roomCode;
        if (!roomCode)
            return;
        const game = activeRooms.get(roomCode);
        if (!game) {
            console.log(`cannot find game with room code "${roomCode}"`);
            return;
        }
        const result = game.playcard(socket.id, cards);
        if (!result.success) {
            console.error(`Invalid card play by ${socket.id} . Reason: ${result.reason}`);
            return;
        }
        io.emit("updateGameState", game.getGameState());
        console.log(`Player ${socket.id} played card ${cards[0].color} ${cards[0].value}`);
    });
    socket.on("drawCardRequest", (ammount) => {
        const roomCode = socket.data.roomCode;
        if (!roomCode)
            return;
        const game = activeRooms.get(roomCode);
        if (!game) {
            console.log(`cannot find game with room code "${roomCode}"`);
            return;
        }
        const result = game.drawCards(socket.id, ammount);
        if (!result.success) {
            console.error(`Invalid draw card by ${socket.id} . Reason: ${result.reason}`);
            return;
        }
        socket.emit("addCards", result.cards);
        console.log(`Player ${socket.id} drew ${ammount} cards`);
    });
});
server.listen(PORT, () => {
    console.log(`UNO server listening on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map