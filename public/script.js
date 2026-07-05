const socket = io({
    reconnectionAttempts: 10
});

// *** connection confirm ***
socket.on("connect", () => {
  console.log(`my socket id: ${socket.id}`);
});

// *** UI Elements ***
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

// *** Main Menu Logic ***
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

// *** Lobby Logic ***
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


// *** Game Initialization Logic ***

let myHand = [];
let myTurn = false;

// Host clicks the start button
document.getElementById('start-game-btn').addEventListener('click', () => {
    socket.emit('startGame');
});

function renderTableCards( cards ){
    if( !cards ){
        console.log("discard pile is empty");
        discardPile.className = "";
        discardPile.innerHTML = "";
        return;
    }

    const discardPile = document.getElementById('discard-pile');
    discardPile.className = `card ${cards.at(-1).color}`;
    discardPile.innerText = cards.at(-1).value;
    console.log(`rendered table card ${cards.at(-1)}`);
    return;
}

// Everyone transitions to the game screen
socket.on('gameStarted', (data) => {
    showScreen('game');
    
    renderTableCards(data.tableCards);
    
    // 2. Render Opponents (Balatro Style Top Layout)
    const opponentsContainer = document.getElementById('opponents-top');
    opponentsContainer.innerHTML = '';
    
    data.players.forEach(p => {
        // We only render OTHER players at the top of the screen
        // TODO: might start with more than 7 cards
        if (p.id !== socket.id) { 
            const oppDiv = document.createElement('div');
            oppDiv.className = 'opponent-avatar';
            oppDiv.id = `opponent-${p.id}`;
            oppDiv.innerHTML = `<strong>${p.name}</strong><br>Cards: 7`; // Everyone starts with 7
            opponentsContainer.appendChild(oppDiv);
        }
    });
});

// *** Hand Rendering Logic ***
socket.on('yourHand', (hand) => {
    // update local memory
    myHand = hand;

    // update display
    const handContainer = document.getElementById('player-hand-bottom');
    handContainer.innerHTML = '';
    
    hand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.color}`;
        cardElement.innerText = card.value;
        
        // Save the card data directly on the HTML element so we can easily retrieve it later
        cardElement.dataset.color = card.color;
        cardElement.dataset.value = card.value;
        
        // 1. SELECT LOGIC: Toggle the 'selected' class when clicked
        cardElement.addEventListener('click', () => {
            cardElement.classList.toggle('selected');
        });

        // 2. DRAG START: Mark the card as being dragged
        cardElement.setAttribute('draggable', true);
        cardElement.addEventListener('dragstart', () => {
            cardElement.classList.add('dragging');
        });

        // 3. DRAG END: Snap it back and clean up
        cardElement.addEventListener('dragend', () => {
            cardElement.classList.remove('dragging');
        });

        handContainer.appendChild(cardElement);
    });
});

// DRAG OVER LOGIC: Allowing cards to be reordered in the hand
const handContainer = document.getElementById('player-hand-bottom');
handContainer.addEventListener('dragover', (e) => {
    e.preventDefault(); // Required to allow dropping
    
    // Find the element we are hovering over to insert BEFORE it
    const afterElement = getDragAfterElement(handContainer, e.clientX);
    const draggable = document.querySelector('.dragging');
    
    if (draggable) {
        if (afterElement == null) {
            handContainer.appendChild(draggable); // Put at the end
        } else {
            handContainer.insertBefore(draggable, afterElement); // Put before the hovered card
        }
    }
});

// Math helper to figure out exactly which card your mouse is hovering over
function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        // Check distance from center of the card
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}


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
});

// --- Action Buttons ---
document.getElementById('btn-play').addEventListener('click', () => {
    // Find all cards the user has clicked
    const selectedCards = document.querySelectorAll('#player-hand-bottom .selected');
    
    if (selectedCards.length === 0) {
        alert("Please select a card first!");
        return;
    }
    
    // TODO: allow multi cards play in one round (custome rules)
    const cardsToPlay = [{
        color: selectedCards[0].dataset.color,
        value: selectedCards[0].dataset.value
    }];
    
    socket.emit('playCardRequest', cardsToPlay);
});

// draw card
const drawCardButton = document.getElementById("btn-draw");
drawCardButton.addEventListener( "click", () => {
    if( !myTurn ){
        console.log("not your turn");
        return;
    }
    
    socket.emit("drawCardRequest");
} );