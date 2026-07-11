"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnoGame = void 0;
class UnoGame {
    // ********** variables **********
    players = {};
    state = "LOBBY";
    rules;
    deck = [];
    tableCards = [];
    turnOrder = [];
    activePlayerIndex = 0;
    turnDirection = 1;
    getActivePlayerID() {
        return this.turnOrder[this.activePlayerIndex];
    }
    getGameState() {
        return { discardPile: this.tableCards, activePlayerID: this.getActivePlayerID() };
        // .at(-1) returns the last element of the array
    }
    // ********** constructor **********
    constructor() {
        this.deck = this.buildDeck();
        this.shuffle(this.deck);
        this.rules = {
            stackDrawTwo: false,
            playMultipleMatches: false,
            addBots: false
        };
    }
    // ********** private functions **********
    buildDeck() {
        const colors = ["red", "blue", "green", "yellow"];
        const values = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "reverse", "+2"];
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
    getNextPlayerIndex(index, cardData) {
        // TODO: seperate the card effect?
        if (this.turnOrder.length <= 0)
            return 0; // no players left
        let steps = 1; // default 1 step
        // special rules
        if (cardData === undefined) {
            steps = 1;
        }
        else if (cardData.value === "skip" || cardData.value === "+2" || cardData.value === "+4") {
            steps = 2;
        }
        else if (cardData.value === "reverse" && this.turnOrder.length == 2) {
            this.reverseTurnDirection();
            steps = 2;
        }
        else if (cardData.value === "reverse") {
            this.reverseTurnDirection();
            steps = 1;
        }
        return (index + this.turnDirection * steps + this.turnOrder.length) % this.turnOrder.length;
    }
    handleTurnIndexOnDisconnection(socketID) {
        const index = this.turnOrder.indexOf(socketID);
        if (index <= -1) {
            console.log("cannot find player to disconnect");
            return this.activePlayerIndex;
        }
        if (index != this.activePlayerIndex) { // disconnected player isn't active
            let result = this.activePlayerIndex;
            if (index < result) {
                result--;
            }
            this.turnOrder.splice(index, 1);
            return result;
        }
        else { // disconnected player is active
            // pass to the next player, also prevents negative modulation
            let result = this.getNextPlayerIndex(this.activePlayerIndex);
            this.turnOrder.splice(index, 1);
            if (this.turnOrder.length <= 0)
                return 0; // no players left
            if (index < result) {
                result--;
            }
            return result;
        }
        return -1; // cannot find player or something went wrong
    }
    reverseTurnDirection() {
        this.turnDirection *= -1;
    }
    dealCardsToPlayers() {
        // Deal 7 cards to each player
        for (let i = 0; i < this.turnOrder.length; i++) {
            let startingHand = [];
            for (let i = 0; i < 7; i++) {
                if (this.deck.length <= 0) {
                    console.log("deck is empty, cannot draw cards");
                }
                else
                    startingHand.push(this.deck.pop());
            }
            this.players[this.turnOrder[i]].hand = startingHand;
        }
    }
    checkCardPlayLegality(cards) {
        //make sure they actually play cards
        if (cards.length != 1) {
            return false;
        }
        // check if discard pile is empty
        if (!this.tableCards) {
            return true;
        }
        // check for single card
        if (cards[0] != undefined) {
            const isValid = cards[0].color == this.tableCards.at(-1).color || cards[0].value == this.tableCards.at(-1).value;
            return isValid;
        }
        // TODO: check for multi cards
        return false;
    }
    removeCardsFromPlayer(socketID, cards) {
        // check if the player exists
        const playerHand = this.players[socketID]?.hand;
        if (!playerHand) {
            return { success: false, reason: "player not found" };
        }
        // make sure to remove at least 1 card
        if (cards.length <= 0) {
            return { success: false, reason: "no cards to remove" };
        }
        // make sure card is in hand
        const cardIndex = this.players[socketID].hand.findIndex(c => c.color == cards[0].color && c.value == cards[0].value);
        if (cardIndex < 0) {
            return { success: false, reason: "cannot find card in hand" };
        }
        // remove the actual card
        playerHand.splice(cardIndex, 1);
        this.players[socketID].hand = playerHand; // applies the change to the actual memory
        return { success: true };
        // TODO: check for multi card plays
    }
    // ********** public functions **********
    addPlayer(socketId, playerName) {
        const isFirstPlayer = this.turnOrder.length === 0;
        this.players[socketId] = {
            id: socketId,
            name: playerName,
            hand: [],
            isHost: isFirstPlayer // The creator of the room is the host
        };
        this.turnOrder.push(socketId);
    }
    getLobbyData() {
        // gets the data of the lobby
        return {
            players: Object.values(this.players).map(p => ({
                id: p.id,
                name: p.name,
                isHost: p.isHost
            })),
            rules: this.rules
        };
    }
    removePlayer(socketId) {
        // 1. Check if they were the host before we delete them
        const wasHost = this.players[socketId]?.isHost;
        // 2. Remove them from the player dictionary
        delete this.players[socketId];
        // 3. Remove them from the turn ring
        this.activePlayerIndex = this.handleTurnIndexOnDisconnection(socketId);
        // --- NEW: HOST MIGRATION ---
        // If the old host left, and there is still at least one person in the room...
        if (wasHost && this.turnOrder.length > 0) {
            // Give the crown to the first person in the array
            const newHostId = this.turnOrder[0];
            this.players[newHostId].isHost = true;
            console.log(`Host migrated to player: ${this.players[newHostId].name}`);
        }
    }
    startGame() {
        this.state = "PLAYING";
        this.dealCardsToPlayers();
        // Flip the first card to start the discard pile
        // We keep drawing until we get a normal card (no wilds to start)
        do {
            this.tableCards.push(this.deck.pop());
        } while (this.tableCards.at(-1).value === 'wild');
        console.log(`Game started! First card is ${this.tableCards.at(-1).color} ${this.tableCards.at(-1).value}`);
    }
    playcard(socketID, cards) {
        const activePlayerID = this.getActivePlayerID();
        // check if the player exists
        const playerHand = this.players[socketID]?.hand;
        if (!playerHand) {
            return { success: false, reason: "player not found" };
        }
        // make sure the game knows who is the active player
        if (!activePlayerID) {
            return { success: false, reason: "cannot find active player" };
        }
        // check if it is their turn
        if (socketID != activePlayerID) {
            return { success: false, reason: "It is not your turn!" };
        }
        // TODO: anti-cheat
        // check if it is legal to play card(s)
        if (!this.checkCardPlayLegality(cards)) {
            return { success: false, reason: "card play isn't legal" };
        }
        // *** all tests passed, play the card ***
        const removeResult = this.removeCardsFromPlayer(socketID, cards);
        if (!removeResult.success) {
            return removeResult;
        }
        this.tableCards.push(...cards); // pushes the cards to the discard pile
        // TODO: calculate card effects
        // pass the turn to next player
        this.activePlayerIndex = this.getNextPlayerIndex(this.activePlayerIndex, cards.at(-1));
        return { success: true };
    }
    // debug
    getGameStateSnapshot() {
        return {
            turnOrder: this.turnOrder,
            currentPlayerIndex: this.activePlayerIndex,
            playDirection: this.turnDirection,
            tableCard: this.tableCards,
            deckSize: this.deck.length,
            players: this.players
        };
    }
}
exports.UnoGame = UnoGame;
//# sourceMappingURL=UnoGame.js.map