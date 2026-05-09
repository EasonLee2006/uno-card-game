"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDeck = buildDeck;
exports.shuffle = shuffle;
exports.removeCardOnce = removeCardOnce;
exports.isCardPlayValid = isCardPlayValid;
exports.isCheating = isCheating;
function buildDeck() {
    const colors = ["red", "blue", "green", "yellow"];
    const values = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "turn", "+2"];
    let newDeck = [];
    for (let color of colors) {
        for (let value of values) {
            newDeck.push({ color: color, value: value });
            if (value == "0")
                continue; // only 1 zero in each color
            newDeck.push({ color: color, value: value });
        }
    }
    return newDeck;
}
function shuffle(cardDeck) {
    for (let i = cardDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardDeck[i], cardDeck[j]] = [cardDeck[j], cardDeck[i]];
    }
}
function removeCardOnce(arr, card) {
    const index = arr.findIndex((c) => { return c.color === card.color && c.value === card.value; });
    if (index > -1) {
        arr.splice(index, 1);
        console.log("removed card from hand", card);
        return true;
    }
    else {
        console.log("cannot find card to remove");
        return false;
    }
}
function isCardPlayValid(card, tableCard) {
    if (tableCard == null) {
        return true;
    }
    return (card.color == tableCard.color || card.value == tableCard.value);
}
function isCheating(playerHand, card) {
    const index = playerHand.findIndex((c) => { return c.color === card.color && c.value === card.value; });
    if (index < 0) {
        return true;
    }
    else
        return false;
}
//# sourceMappingURL=gameLogic.js.map