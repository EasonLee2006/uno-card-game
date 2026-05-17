"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnoGame = void 0;
class UnoGame {
    deck = [];
    tableCard = undefined;
    getTableCard() { return this.tableCard; }
    ;
    setTableCard(cardData) { this.tableCard = cardData; }
    ;
    players = {};
    getPlayers() { return this.players; }
    ;
    constructor() {
        this.deck = this.buildDeck();
        this.shuffle(this.deck);
    }
    buildDeck() {
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
    shuffle(cardDeck) {
        for (let i = cardDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardDeck[i], cardDeck[j]] = [cardDeck[j], cardDeck[i]];
        }
    }
    // ********** public functions **********
    addPlayer(socketID) {
        const startingHand = [];
        for (let i = 0; i < 7; i++) {
            if (this.deck.length <= 0) {
                console.log("deck is empty, cannot draw cards");
            }
            else
                startingHand.push(this.deck.pop());
        }
        this.players[socketID] = startingHand;
        return startingHand;
    }
    removePlayer(socketID) {
        delete this.players[socketID];
    }
    tryPlayCard(socketID, cardData) {
        const playerHand = this.players[socketID];
        if (!playerHand) {
            return { success: false, reason: "player not found" };
        }
        const cardIndex = playerHand.findIndex(c => c.color == cardData.color && c.value == cardData.value);
        if (cardIndex < 0) {
            return { success: false, reason: "cannot find card in hand" };
        }
        if (this.tableCard != undefined) {
            const isValid = cardData.color == this.tableCard.color || cardData.value == this.tableCard.value;
            if (!isValid)
                return { success: false, reason: "card doesn't match" };
        }
        playerHand.splice(cardIndex, 1);
        this.tableCard = cardData;
        return { success: true };
    }
    drawCard(socketID) {
        if (this.deck.length <= 0)
            return null;
        const drawnCard = this.deck.pop();
        if (this.players[socketID]) {
            this.players[socketID].push(drawnCard);
        }
        return drawnCard;
    }
}
exports.UnoGame = UnoGame;
//# sourceMappingURL=UnoGame.js.map