import { Card, CardColor, Gamestate } from "./types"

export class UnoGame {
    // ********** variables **********
    private deck: Card[] = [];

    private tableCard: Card | undefined = undefined;
    public getTableCard() :Card | undefined { return this.tableCard; };
    public setTableCard( cardData: Card ){ this.tableCard = cardData };

    private players: Record<string, Card[]> = {};
    public getPlayers() { return this.players; };
    public setPlayerHand( socketID: string, cards: Card[] ): void{
        // will not remove cards from drawing pile
        this.players[socketID] = cards;
        return;
    }

    private turnOrder: string[] = [];
    private currentTurnIndex: number = 0;
    private turnDirection: 1|-1 = 1;

    public getActivePlayerID(): string | undefined{
        return this.turnOrder[this.currentTurnIndex];
    }

    public getGameState(): Gamestate{
        return { tableCard: this.getTableCard(), activePlayerID: this.getActivePlayerID() };
    }


    // ********** constructor **********

    constructor() {
        this.deck = this.buildDeck();
        this.shuffle(this.deck);
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
        }else if( cardData.value === "skip" ){
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

        return ( (index + this.turnDirection * steps) % this.turnOrder.length + this.turnOrder.length) % this.turnOrder.length;
    }

    private handleTurnIndexOnDisconnection( socketID: string ): number{
        const index = this.turnOrder.indexOf( socketID );
        
        if( index > -1 ){
            // pass to the next player, also prevents negative modulation
            let result: number = this.getNextPlayerIndex( this.currentTurnIndex );
            
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

    public addPlayerAndDealCards(socketID: string): Card[] {
        const startingHand: Card[] = [];
        for (let i = 0; i < 7; i++) {
            if (this.deck.length <= 0) {
                console.log("deck is empty, cannot draw cards");
            }
            else startingHand.push(this.deck.pop()!);
        }

        this.players[socketID] = startingHand;
        this.turnOrder.push(socketID);

        console.log(`active player id: ${this.getActivePlayerID()}`);
        return startingHand;
    }

    public removePlayer( socketID: string ): void{
        delete this.players[socketID];
        this.currentTurnIndex = this.handleTurnIndexOnDisconnection( socketID );
    }

    public tryPlayCard( socketID: string, cardData: Card ): { success: boolean, reason?: string }{
        
        // turn-based
        const activePlayerID: string | undefined = this.turnOrder[ this.currentTurnIndex ];
        if( socketID !== activePlayerID ){
            return { success: false, reason: "It is not your turn!" };
        }

        // check if the player exists
        const playerHand = this.players[socketID];
        if( !playerHand ){
            return { success: false, reason: "player not found"};
        }
        
        // check if player is cheating
        const cardIndex = playerHand.findIndex( c => c.color == cardData.color && c.value == cardData.value )
        if( cardIndex < 0 ){
            return { success: false, reason: "cannot find card in hand"};
        }

        // check if it's legal to play card
        if( this.tableCard != undefined){
            const isValid: boolean = cardData.color == this.tableCard.color || cardData.value == this.tableCard.value;
            if ( !isValid ) return { success: false, reason: "card doesn't match" };
        }

        // *** play card ***
        // remove card from player (server side)
        playerHand.splice( cardIndex, 1 );
        this.tableCard = cardData;

        // pass turn to next player
        this.currentTurnIndex = this.getNextPlayerIndex( this.currentTurnIndex, cardData );
        
        return {success: true};
    }

    public drawCard( socketID: string ): Card | null{
        if ( this.deck.length <= 0 ) return null;

        const drawnCard = this.deck.pop()!;
        if( this.players[socketID] ){
            this.players[ socketID ].push( drawnCard );
        }
        return drawnCard;
    }
}