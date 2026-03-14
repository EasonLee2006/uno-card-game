const socket = io();

const myHand = [
    {color:    "red", value: "7"},
    {color:   "blue", value: "skip"},
    {color: "yellow", value: "10"},
    {color:  "black", value: "wild"},
    {color:  "green", value: "+2"},
    {color:   "blue", value: "3"},
    {color:    "red", value: "7"},
];

const handContainer = document.getElementById("player-hand");

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
            socket.emit("playCard", cardData);
            cardElement.remove();
        });
        handContainer.appendChild(cardElement);
    });
}

socket.on( "updateTable", (cardData)=>{
    console.log("received info: played card", {cardData});

    const discardPile = document.getElementById("discard-pile");

    discardPile.className = `card ${cardData.color}`;
    discardPile.innerHTML = cardData.value;
} );

renderHand();