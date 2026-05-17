import express = require("express");
import http = require("http");
import { Server, Socket } from 'socket.io';

import { Card } from "./types";
import { UnoGame } from "./UnoGame";


const app = express();
const server = http.createServer( app );
const io = new Server(server);

const PORT = 3000;
app.use(express.static("public"));

const activeGame = new UnoGame;

// connection
io.on( "connection", (socket: Socket)=>{
    console.log(`A user has connected to the server. Socket ID: ${socket.id}`);

    const startingHand = activeGame.addPlayer( socket.id );
    socket.emit("yourHand", startingHand)
    socket.emit( "updateTable", activeGame.getTableCard() );

    socket.on( "playCardRequest", ( cardData: Card )=>{   
        const result: {success: boolean, reason?: string} = activeGame.tryPlayCard( socket.id, cardData );
        if( !result.success ){
            console.log(`Invalid card play by ${socket.id} . Reason: ${result.reason}`);
            return;
        }
        
        activeGame.setTableCard( cardData );
        io.emit("updateTable", cardData);
        console.log(`Player ${socket.id} played card ${cardData.color} ${cardData.value}`);

    } );

    socket.on( "drawCardRequest", ()=>{
        const drawnCard = activeGame.drawCard( socket.id );
        if( !drawnCard ){
            console.log( "Draw pile is empty." );
            return;
        }

        console.log(`Player ${socket.id} drew ${drawnCard.color} ${drawnCard.value}`);
        socket.emit("drawCardResponse", drawnCard);
    } );

    socket.on( "disconnect", ()=>{
        console.log(`A user has disconnected. Socket ID: ${socket.id}`);
        activeGame.removePlayer( socket.id );
    } );
});

server.listen( PORT, ()=>{
    console.log(`UNO server listening on http://localhost:${PORT}`);
} );