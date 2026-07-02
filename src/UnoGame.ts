import { Card, CardColor, Gamestate, Player, GameRules } from "./types"

export class UnoGame {
    // ********** variables **********
    public players: Record<string, Player> = {};
    public state: "LOBBY" | "PLAYING" | "FINISHED" = "LOBBY";
    public rules: GameRules;

    private deck: Card[] = [];
    public tableCard: Card | undefined = undefined;


    public setPlayerHand( socketID: string, cards: Card[] ): void{
        if( !this.players[socketID] ){
            console.log("player not found");
            return;
        }
        // will not remove cards from drawing pile
        this.players[socketID].hand = cards;
        return;
    }

    public turnOrder: string[] = [];
    public currentPlayerIndex: number = 0;
    public turnDirection: 1|-1 = 1;

    public getActivePlayerID(): string | undefined{
        return this.turnOrder[this.currentPlayerIndex];
    }

    public getGameState(): Gamestate{
        return { tableCard: this.tableCard, activePlayerID: this.getActivePlayerID() };
    }

    private totalPenalty = 0;
    public getTotalPenalty(){ return this.totalPenalty; }


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

    private buildDeck(): Card[] {
        const colors: CardColor[] = ["red", "blue", "green", "yellow"];
        const values: string[] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "reverse", "+2"];

        let newDeck: Card[] = [];

        for (let color of colors) {
            for (let value of values) {
                newDeck.push({ color: color, value: value });
                if (value == "0") continue; // only 1 zero in each color

                newDeck.push({ color: color, value: value });
            }
        }
        return newDeck;
    }

    private shuffle(cardDeck: Card[]) {
        for (let i = cardDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [cardDeck[i], cardDeck[j]] = [cardDeck[j]!, cardDeck[i]!];
        }
    }

    private getNextPlayerIndex( index: number, cardData?: Card ): number{
        if( this.turnOrder.length <= 0 ) return 0; // no players left

        let steps: number = 1; // default 1 step

        // special rules
        if( cardData === undefined ){
            steps = 1;
        }else if( cardData.value === "skip" || cardData.value === "+2"|| cardData.value === "+4" ){
            steps = 2;
        }
        else if( cardData.value === "reverse" && this.turnOrder.length == 2 ){
            this.reverseTurnDirection();
            steps = 2;
        }
        else if( cardData.value === "reverse" ){
            this.reverseTurnDirection();
            steps = 1;
        }

        return (index + this.turnDirection * steps + this.turnOrder.length) % this.turnOrder.length ;
    }

    private handleTurnIndexOnDisconnection( socketID: string ): number{
        const index = this.turnOrder.indexOf( socketID );
        if( index <= -1 ){
            console.log("cannot find player to disconnect");
            return this.currentPlayerIndex;
        }
        if( index != this.currentPlayerIndex ){ // disconnected player isn't active
            let result = this.currentPlayerIndex;
            if( index < result ){
                result--;
            }
            this.turnOrder.splice(index, 1);
            return result
        }
        else{ // disconnected player is active

            // pass to the next player, also prevents negative modulation
            let result: number = this.getNextPlayerIndex( this.currentPlayerIndex );
            
            this.turnOrder.splice(index, 1);
            if( this.turnOrder.length <= 0 ) return 0; // no players left

            if( index < result ){
                result--;
            }

            return result;
        }

        return -1; // cannot find player or something went wrong
    }

    private reverseTurnDirection(): void{
        this.turnDirection *= -1;
    }


    // ********** public functions **********

    public addPlayer(socketId: string, playerName: string): void {
        const isFirstPlayer = this.turnOrder.length === 0;

        this.players[socketId] = {
            id: socketId,
            name: playerName,
            hand: [],
            isHost: isFirstPlayer // The creator of the room is the host
        };
        
        this.turnOrder.push(socketId);
    }

    public getLobbyData() {
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

    public removePlayer( socketId: string ): void{
        // 1. Check if they were the host before we delete them
        const wasHost = this.players[socketId]?.isHost;
        
        // 2. Remove them from the player dictionary
        delete this.players[socketId];
        
        // 3. Remove them from the turn ring
        this.currentPlayerIndex = this.handleTurnIndexOnDisconnection( socketId );


        // --- NEW: HOST MIGRATION ---
        // If the old host left, and there is still at least one person in the room...
        if (wasHost && this.turnOrder.length > 0) {
            // Give the crown to the first person in the array
            const newHostId: string = this.turnOrder[0]!;
            this.players[newHostId]!.isHost = true;
            console.log(`Host migrated to player: ${this.players[newHostId]!.name}`);
        }
    }

    

    public tryPlayCard( socketID: string, cardData: Card ): { success: boolean, reason?: string, affectedPlayers: {socketID: string, action: string}[] }{
        let affectedPlayers: {socketID: string, action: string}[] = [];

        // turn-based
        const activePlayerID: string | undefined = this.getActivePlayerID();
        if( socketID !== activePlayerID ){
            return { success: false, reason: "It is not your turn!", affectedPlayers };
        }

        // check if the player exists
        const playerHand = this.players[socketID]?.hand;
        if( !playerHand ){
            return { success: false, reason: "player not found", affectedPlayers};
        }
        
        // check if player is cheating
        const cardIndex = playerHand.findIndex( c => c.color == cardData.color && c.value == cardData.value )
        if( cardIndex < 0 ){
            affectedPlayers.push( {socketID: socketID, action: "cheating"} );
            return { success: false, reason: "cannot find card in hand", affectedPlayers};
        }

        // check if it's legal to play card
        if( this.tableCard != undefined){
            const isValid: boolean = cardData.color == this.tableCard.color || cardData.value == this.tableCard.value;
            if ( !isValid ) return { success: false, reason: "card doesn't match", affectedPlayers };
        }

        // *** play card ***
        // remove card from player (server side)
        playerHand.splice( cardIndex, 1 );
        this.tableCard = cardData;
        affectedPlayers.push( {socketID: socketID, action: "play card"} );

        // check for penalty cards
        // const punnishPlayerID: string = this.turnOrder[ this.getNextPlayerIndex( this.currentPlayerIndex ) ]!;
        // if( cardData.value == "+2" ){
        //     this.totalPenalty += 2;
        // }else if ( cardData.value == "+4" ){
        //     this.totalPenalty += 4;
        // }
        // this.forceDrawCard( punnishPlayerID, this.totalPenalty );
        // affectedPlayers.push( {socketID: punnishPlayerID, action: `draw ${this.totalPenalty} cards`} );

        // this.totalPenalty = 0; // reset total penalty

        // pass turn to next player
        this.currentPlayerIndex = this.getNextPlayerIndex( this.currentPlayerIndex, cardData );
        
        return {success: true, affectedPlayers};
    }

    public forceDrawCard( socketID: string, num: number ): {success: boolean, reason?: string, cards: Card[]}{
        let drawnCards: Card[] = [];
        
        // make sure deck isnt empty
        if ( this.deck.length < num ) return {success: false, reason: "not enough cards in deck", cards: drawnCards};

        for( let i=0 ; i<num ; i++ ){
            drawnCards.push( this.deck.pop()! );
            this.players[socketID]?.hand.push( drawnCards[i]! );
        }
        return {success: true, cards: drawnCards};
    }

    public tryDrawCard( socketID: string ): {success: boolean, reason?: string, cardData?: Card}{
        const activePlayerID: string | undefined = this.turnOrder[ this.currentPlayerIndex ];
        
        // turn-based
        if( socketID !== activePlayerID ) return { success: false, reason: "It is not your turn!" };

        // make sure deck isnt empty
        if ( this.deck.length <= 0 ) return {success: false, reason: "deck is empty"};

        // (success)
        const drawnCard = this.deck.pop()!;
        if( this.players[socketID] ){
            this.players[ socketID ].hand.push( drawnCard );
        }
        return {success: true, cardData: drawnCard};
    }

    // debug
    public getGameStateSnapshot() {
        return {
            turnOrder: this.turnOrder,
            currentPlayerIndex: this.currentPlayerIndex,
            playDirection: this.turnDirection,
            tableCard: this.tableCard,
            deckSize: this.deck.length, 
            players: this.players
        };
    }
}