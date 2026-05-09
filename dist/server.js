"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { table } = require("console");
const { start } = require("repl");
const express = require("express");
const http = require("http");
const socket_io_1 = require("socket.io");
const gameLogic_1 = require("./gameLogic");
const app = express();
const server = http.createServer(app);
const io = new socket_io_1.Server(server);
const PORT = 3000;
app.use(express.static("public"));
;
// card deck utilities
let deck = [];
let tableCard = undefined;
let players = {};
deck = (0, gameLogic_1.buildDeck)();
(0, gameLogic_1.shuffle)(deck);
console.log("Deck is ready to deal. Total cards:", deck.length);
function dealCardToPlayer(socket) {
    const startingHand = [];
    for (let i = 0; i < 7; i++) {
        if (deck.length <= 0) {
            console.log("deck is empty, cannot draw cards");
        }
        else
            startingHand.push(deck.pop());
    }
    players[socket.id] = startingHand;
    socket.emit("yourHand", startingHand);
}
function drawCardAndRespond(socket) {
    if (deck.length <= 0) {
        console.log("deck is empty, cannot draw cards");
        return;
    }
    const drawnedCard = deck.pop();
    console.log(`Player ${socket.id} drew the card`, drawnedCard);
    players[socket.id].push(drawnedCard);
    socket.emit("drawCardResponse", drawnedCard);
}
// connection
io.on("connection", (socket) => {
    console.log(`A user has connected to the server. Socket ID: ${socket.id}`);
    dealCardToPlayer(socket);
    socket.emit("updateTable", tableCard);
    socket.on("playCardRequest", (cardData) => {
        console.log(`Player ${socket.id} played `, cardData);
        if ((0, gameLogic_1.isCheating)(players[socket.id], cardData)) {
            console.log("player is cheating", socket.id);
            return;
        }
        if (!(0, gameLogic_1.isCardPlayValid)(cardData, tableCard)) {
            console.log("card play isn't valid");
        }
        else {
            tableCard = cardData;
            (0, gameLogic_1.removeCardOnce)(players[socket.id], cardData);
            console.log("played card", cardData);
            console.log(`player ${socket.id} now has`, players[socket.id]);
            io.emit("updateTable", cardData);
        }
    });
    socket.on("drawCardRequest", () => {
        drawCardAndRespond(socket);
    });
    socket.on("disconnect", () => {
        console.log(`A user has disconnected. Socket ID: ${socket.id}`);
        delete players[socket.id];
    });
});
server.listen(PORT, () => {
    console.log("UNO game server is on!");
    console.log(`Listening on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map