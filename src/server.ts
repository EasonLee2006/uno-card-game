import express = require("express");
import http = require("http");
import { Server, Socket } from 'socket.io';

import { Card, Gamestate } from "./types";
import { UnoGame } from "./UnoGame";


const app = express();
const server = http.createServer( app );
const io = new Server(server);

const PORT = 3000;
app.use(express.static("public"));

const activeGame = new UnoGame();

// connection
io.on( "connection", (socket: Socket)=>{
    console.log(`A user has connected to the server. Socket ID: ${socket.id}`);

    const startingHand = activeGame.addPlayerAndDealCards( socket.id );
    socket.emit("updateHand", startingHand);
    socket.emit( "updateGameState", activeGame.getGameState() );

    socket.on( "playCardRequest", ( cardData: Card )=>{   
        const result: {success: boolean, reason?: string, affectedPlayers: {socketID: string, action: string}[]} = activeGame.tryPlayCard( socket.id, cardData );
        if( !result.success ){
            console.log(`Invalid card play by ${socket.id} . Reason: ${result.reason}`);
            return;
        }
        
        activeGame.setTableCard( cardData );

        io.emit("updateGameState", activeGame.getGameState());

        for( const affectedPlayer of result.affectedPlayers ){
            // TODO: update affected player gamestate
        }
        
        console.log(`Player ${socket.id} played card ${cardData.color} ${cardData.value}`);

    } );

    socket.on( "drawCardRequest", ()=>{
        const result: {success: boolean, reason?: string, cardData?: Card} = activeGame.tryDrawCard( socket.id );
        if( !result.success ){
            console.log(`Invalid draw card by ${socket.id} . Reason: ${result.reason}`);
            return;
        }

        const drawnCard = result.cardData!;
        console.log(`Player ${socket.id} drew ${drawnCard.color} ${drawnCard.value}`);
        socket.emit("drawCardResponse", drawnCard);
    } );

    socket.on( "disconnect", ()=>{
        console.log(`A user has disconnected. Socket ID: ${socket.id}`);
        activeGame.removePlayer( socket.id );
        io.emit("updateGameState", activeGame.getGameState());

    } );
});

server.listen( PORT, ()=>{
    console.log(`UNO server listening on http://localhost:${PORT}`);
} );