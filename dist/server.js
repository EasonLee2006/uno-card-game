"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { table } = require("console");
const { start } = require("repl");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const PORT = 3000;
app.use(express_1.default.static("public"));
;
// card deck utilities
let deck = [];
let tableCard; //undefined
let players = {};
function buildDeck() {
    const colors = ["red", "blue", "green", "yellow"];
    const values = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "turn", "+2"];
    let newDeck = [];
    for (let color of colors) {
        for (let value of values) {
            newDeck.push({ color: color, value: value });
            if (value == "0")
                continue; // only 1 zero in each color
            newDeck.push({ color: color, value: value });
        }
    }
    return newDeck;
}
function shuffle(cardDeck) {
    for (let i = cardDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardDeck[i], cardDeck[j]] = [cardDeck[j], cardDeck[i]];
    }
}
deck = buildDeck();
shuffle(deck);
console.log("Deck is ready to deal. Total cards:", deck.length);
function dealCardToPlayer(socket) {
    const startingHand = [];
    for (let i = 0; i < 7; i++) {
        if (deck.length <= 0) {
            console.log("deck is empty, cannot draw cards");
        }
        startingHand.push(deck.pop());
    }
    players[socket.id] = startingHand;
    socket.emit("yourHand", startingHand);
}
function removeCardOnce(arr, card) {
    const index = arr.findIndex((c) => { return c.color === card.color && c.value === card.value; });
    if (index > -1) {
        arr.splice(index, 1);
        console.log("removed card from hand", card);
        return true;
    }
    else {
        console.log("cannot find card to remove");
        return false;
    }
}
function drawCardAndRespond(socket) {
    const drawnedCard = deck.pop();
    console.log(`Player ${socket.id} drew the card`, drawnedCard);
    players[socket.id].push(drawnedCard);
    socket.emit("drawCardResponse", drawnedCard);
}
function isCheating(socket, card) {
    const index = players[socket.id].findIndex((c) => { return c.color === card.color && c.value === card.value; });
    if (index < 0) {
        return true;
    }
    else
        return false;
}
function isCardPlayValid(card) {
    if (tableCard == null) {
        return true;
    }
    if (card.color == tableCard.color || card.value == tableCard.value) {
        return true;
    }
    else {
        return false;
    }
}
// connection
io.on("connection", (socket) => {
    console.log(`A user has connected to the server. Socket ID: ${socket.id}`);
    dealCardToPlayer(socket);
    socket.emit("updateTable", tableCard);
    socket.on("playCardRequest", (cardData) => {
        console.log(`Player ${socket.id} played `, cardData);
        if (isCheating(socket, cardData)) {
            console.log("player is cheating", socket.id);
        }
        if (!isCardPlayValid(cardData)) {
            console.log("card play isn't valid");
        }
        else {
            tableCard = cardData;
            removeCardOnce(players[socket.id], cardData);
            console.log("played card", cardData);
            console.log(`player ${socket.id} now has`, players[socket.id]);
            io.emit("updateTable", cardData);
        }
        // tableCard = cardData;
        // removeCardOnce( players[socket.id], cardData );
        // io.emit("updateTable", cardData);
        // console.log(`Player ${socket.id} now has `, players[socket.id]);
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