// src/server.ts
import express from "express";
import http from "http";
import { Server, Socket } from 'socket.io';
import { UnoGame } from './UnoGame';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;
app.use(express.static("public"));

// NEW: The Room Manager. A dictionary of active games.
const activeRooms = new Map<string, UnoGame>();

io.on("connection", (socket: Socket) => {
    console.log(`User connected. Socket ID: ${socket.id}`);

    // --- STEP 1: Joining a Lobby ---
    socket.on("joinRoom", (data: { name: string, roomCode: string }) => {
        const roomCode = data.roomCode.toUpperCase();
        
        // 1. Check if room exists. If not, create it.
        let game = activeRooms.get(roomCode);
        if (!game) {
            game = new UnoGame();
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
                } else {
                    // Tell remaining players someone left
                    io.to(roomCode).emit("lobbyUpdated", game.getLobbyData());
                    console.log(`${socket.id} disconnected`);
                }
            }
        }
    });

    // TODO: playCardRequest and drawCardRequest
});

server.listen(PORT, () => {
    console.log(`UNO server listening on http://localhost:${PORT}`);
});