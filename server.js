const express = require("express");
const http = require("http");
const { start } = require("repl");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer( app );
const io = new Server(server);

const PORT = 3000;
app.use(express.static("public"));


// card deck utilities
let deck = [];
let players = {};

function buildDeck(){
    const colors = ["red", "blue", "green", "yellow"];
    const values = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "turn", "+2"];

    let newDeck = [];

    for(let color of colors){
        for(let value of values){
            newDeck.push( { color: color, value: value } );
            if( value == 0 ) continue; // only 1 zero in each color

            newDeck.push( { color: color, value: value } );
        }
    }
    return newDeck;
}

function shuffle( /** @type {Array} */ cardDeck ){
    for(let i = cardDeck.length-1 ; i>0 ; i--){
        const j = Math.floor(Math.random() * (i + 1));

        let temp = cardDeck[i];
        cardDeck[i] = cardDeck[j];
        cardDeck[j] = temp;
    }
}

deck = buildDeck();
shuffle( deck );
console.log("Deck is ready to deal. Total cards:", deck.length);

function dealCardToPlayer( socket ){
    const startingHand = [];
    for(let i=0 ; i<7 ; i++){
        startingHand.push( deck.pop() );
    }

    players[socket.id] = startingHand;

    socket.emit("yourHand", startingHand);
}

// connection
io.on( "connection", (socket)=>{
    console.log(`A user has connected to the server. Socket ID: ${socket.id}`);

    dealCardToPlayer(socket);

    socket.on( "playCard", ( cardData )=>{
        console.log(`Player ${socket.id} played `, cardData);

        io.emit("updateTable", cardData);
    } );

    socket.on( "disconnect", ()=>{
        console.log(`A user has disconnected. Socket ID: ${socket.id}`);
        delete players[socket.id];
    } );
});

server.listen( PORT, ()=>{
    console.log("UNO game server is on!");
    console.log(`Listening on http://localhost:${PORT}`);
} );