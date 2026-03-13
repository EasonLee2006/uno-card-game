const myHand = [
    {color:    "red", value: "7"},
    {color:   "blue", value: "skip"},
    {color: "yellow", value: "10"},
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
            console.log(`clicked ${card.value} of ${card.color}`);
        });
        handContainer.appendChild(cardElement);
    });
}

renderHand();