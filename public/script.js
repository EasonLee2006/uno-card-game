const socket = io({
    reconnectionAttempts: 10
});

// --- UI Elements ---
const screens = {
    main: document.getElementById('main-screen'),
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen')
};

// UI Switching Function
function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    // Show the requested screen
    screens[screenName].classList.remove('hidden');
}

// --- Main Menu Logic ---
document.getElementById('join-room-btn').addEventListener('click', () => {
    const name = document.getElementById('player-name-input').value.trim();
    const roomCode = document.getElementById('room-code-input').value.trim().toUpperCase();

    if (!name || !roomCode) {
        alert("Please enter both a name and a room code!");
        return;
    }

    // 1. Tell server we want to join
    socket.emit('joinRoom', { name, roomCode });
    
    // 2. Update UI to show we are in the lobby
    document.getElementById('display-room-code').innerText = roomCode;
    showScreen('lobby');
});

// --- Lobby Logic ---
socket.on('lobbyUpdated', (lobbyData) => {
    const playerList = document.getElementById('lobby-player-list');
    playerList.innerHTML = ''; // Clear old list

    // Populate the roster
    lobbyData.players.forEach(player => {
        const li = document.createElement('li');
        li.innerText = player.name + (player.isHost ? " 👑 (Host)" : "");
        playerList.appendChild(li);

        // If I am the host, show the "Start Game" button!
        if (player.id === socket.id && player.isHost) {
            document.getElementById('start-game-btn').classList.remove('hidden');
        }
    });
});

let myHand = [];
let myTurn = false;

const handContainer = document.getElementById("player-hand");

function removeCardOnce(arr, card){
    const index = arr.findIndex( (c) => { return c.color === card.color && c.value === card.value } );
    if( index > -1 ){
        arr.splice(index, 1);
        console.log("removed card from hand", card);
        return true;
    }else{
        console.log("cannot find card to remove");
        return false;
    }
}

function canPlayCard( cardData ){
    if( !myTurn ){
        console.log("not your turn");
        return false;
    }

    const discardPile = document.getElementById("discard-pile");
    console.log("discard-pile:", { color: discardPile.classList[1], value: discardPile.innerHTML} );

    const handColor = cardData.color
    const handValue = cardData.value

    const tableColor = discardPile.classList[1];
    const tableValue = discardPile.innerHTML;

    if( !tableColor ){
        console.log("no previous cards, can play card");
        return true;
    }

    if( handColor == tableColor || handValue == tableValue ){
        console.log("cards matched, can play card");
        return true;
    }

    console.log("cannot play card");
    return false;
}

function renderHand(){
    handContainer.innerHTML = "";

    myHand.forEach((card, index) => {
        const cardElement = document.createElement("div");

        cardElement.classList.add("card");
        cardElement.classList.add(card.color);
        cardElement.innerText = card.value;

        cardElement.addEventListener("click", ()=>{
            const cardData = { color: card.color, value: card.value };
            console.log(`clicked ${card.value} of ${card.color}`);
            
            if( !canPlayCard(cardData) ){ 
                return; 
            }else{
                socket.emit("playCardRequest", cardData);
                myTurn = false;
                removeCardOnce(myHand, cardData);
                cardElement.remove();
            }
        });
        handContainer.appendChild(cardElement);
    });
}

socket.on("connect", () => {
  console.log(`my socket id: ${socket.id}`); // Example: "ojIckSD2jqNzOqIrAGzL"
});

socket.on("updateHand", (dealtCards)=>{
    console.log("your hand is: ", dealtCards);
    myHand = dealtCards;

    renderHand();
});

socket.on( "updateTable", (cardData)=>{
    console.log("received info: played card", {cardData});

    const discardPile = document.getElementById("discard-pile");

    if( cardData == undefined ){ // when discard pile is empty
        console.log("discard pile is empty");
        discardPile.className = "";
        discardPile.innerHTML = "";
        return;
    }

    console.log("update discard pile");
    discardPile.className = `card ${cardData.color}`;
    discardPile.innerHTML = cardData.value;
} );

socket.on( "updateGameState", (gameState)=>{

    // *** update table card ***
    const discardPile = document.getElementById("discard-pile");

    if( gameState.tableCard == undefined ){ // when discard pile is empty
        console.log("discard pile is empty");
        discardPile.className = "";
        discardPile.innerHTML = "";
    }else{
        console.log("update table card");
        discardPile.className = `card ${gameState.tableCard.color}`;
        discardPile.innerHTML = gameState.tableCard.value;
    }


    // *** update turns ***
    if( gameState.activePlayerID == socket.id ){
        myTurn = true;
    }else{
        myTurn = false;
    }
} );


// draw card
const drawCardButton = document.getElementById("btn-draw");
drawCardButton.addEventListener( "click", () => {
    if( !myTurn ){
        console.log("not your turn");
        return;
    }
    
    socket.emit("drawCardRequest");
} );

socket.on("drawCardResponse", (cardData)=>{
    console.log("drawn card: ", cardData);
    myHand.push(cardData);

    renderHand();
});

renderHand();