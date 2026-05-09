const { table } = require("console");
const { start } = require("repl");

import express = require("express");
import http = require("http");
import { Server, Socket } from 'socket.io';

import { buildDeck, shuffle, removeCardOnce, isCheating, isCardPlayValid } from "./gameLogic";

const app = express();
const server = http.createServer( app );
const io = new Server(server);

const PORT = 3000;
app.use(express.static("public"));

type CardColor = "red"| "blue"| "green"| "yellow";

interface Card {
    color: CardColor;
    value: string;
};

// card deck utilities
let deck: Card[] = [];
let tableCard: Card | undefined = undefined;
let players: Record< string, Card[] > = {};


deck = buildDeck();
shuffle( deck );
console.log("Deck is ready to deal. Total cards:", deck.length);

function dealCardToPlayer( socket: Socket ){
    const startingHand: Card[] = [];
    for(let i=0 ; i<7 ; i++){
        if(deck.length <= 0){
            console.log("deck is empty, cannot draw cards");
        }
        else startingHand.push( deck.pop()! );
    }

    players[socket.id] = startingHand;

    socket.emit("yourHand", startingHand);
}

function drawCardAndRespond( socket: Socket ){
    if(deck.length <= 0){
        console.log("deck is empty, cannot draw cards");
        return;
    }
    const drawnedCard: Card = deck.pop()!;
    console.log(`Player ${socket.id} drew the card`, drawnedCard);
    players[socket.id]!.push( drawnedCard );
    socket.emit("drawCardResponse", drawnedCard);
}

// connection
io.on( "connection", (socket: Socket)=>{
    console.log(`A user has connected to the server. Socket ID: ${socket.id}`);

    dealCardToPlayer(socket);
    socket.emit("updateTable", tableCard);

    socket.on( "playCardRequest", ( cardData: Card )=>{   
        console.log(`Player ${socket.id} played `, cardData);

        if( isCheating(players[socket.id]!, cardData) ){
            console.log("player is cheating", socket.id);
            return;
        }

        if( !isCardPlayValid( cardData, tableCard ) ){
            console.log("card play isn't valid");
        }else{
            tableCard = cardData;
            removeCardOnce( players[socket.id]!, cardData );

            console.log("played card", cardData);
            console.log(`player ${socket.id} now has`, players[socket.id]);
            
            io.emit("updateTable", cardData);
        }
    } );

    socket.on( "drawCardRequest", ()=>{
        drawCardAndRespond( socket );
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