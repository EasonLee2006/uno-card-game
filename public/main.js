const socket = io();

let myHand = [];

const handContainer = document.getElementById("player-hand");

function canPlayCard( cardData ){
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
                socket.emit("playCard", cardData);
                cardElement.remove();
            }
        });
        handContainer.appendChild(cardElement);
    });
}


socket.on("yourHand", (dealtCards)=>{
    console.log("got dealt cards from server: ", dealtCards);
    myHand = dealtCards;

    renderHand();
});

socket.on( "updateTable", (cardData)=>{
    console.log("received info: played card", {cardData});

    const discardPile = document.getElementById("discard-pile");

    if( !cardData.color ){ // when discard pile is empty
        console.log("discard pile is empty");
        discardPile.className = "";
        discardPile.innerHTML = "";
        return;
    }

    console.log("update discard pile");
    discardPile.className = `card ${cardData.color}`;
    discardPile.innerHTML = cardData.value;
} );

renderHand();