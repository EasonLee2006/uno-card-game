const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer( app );
const io = new Server(server);

const PORT = 3000;
app.use(express.static("public"));

io.on( "connection", (socket)=>{
    console.log(`A user has connected to the server. Socket ID: ${socket.id}`);

    socket.on( "playCard", ( cardData )=>{
        console.log(`Player ${socket.id} played `, cardData);

        io.emit("updateTable", cardData);
    } );

    socket.on( "disconnect", ()=>{
        console.log(`A user has disconnected. Socket ID: ${socket.id}`);
    } );
} );

server.listen( PORT, ()=>{
    console.log("UNO game server is on!");
    console.log(`Listening on http://localhost:${PORT}`);
} );