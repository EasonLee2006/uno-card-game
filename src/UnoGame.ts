import { Card, CardColor } from "./types"

export class UnoGame {
    private deck: Card[] = [];

    private tableCard: Card | undefined = undefined;
    public getTableCard() :Card | undefined { return this.tableCard; };
    public setTableCard( cardData: Card ){ this.tableCard = cardData };

    private players: Record<string, Card[]> = {};
    public getPlayers() { return this.players; };

    constructor() {
        this.deck = this.buildDeck();
        this.shuffle(this.deck);
    }


    private buildDeck(): Card[] {
        const colors: CardColor[] = ["red", "blue", "green", "yellow"];
        const values: string[] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "turn", "+2"];

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

        return startingHand;
    }

    public removePlayer( socketID: string ): void{
        delete this.players[socketID];
    }

    public tryPlayCard( socketID: string, cardData: Card ): { success: boolean, reason?: string }{
        const playerHand = this.players[socketID];
        if( !playerHand ){
            return { success: false, reason: "player not found"};
        }
        
        const cardIndex = playerHand.findIndex( c => c.color == cardData.color && c.value == cardData.value )
        if( cardIndex < 0 ){
            return { success: false, reason: "cannot find card in hand"};
        }

        if( this.tableCard != undefined){
            const isValid: boolean = cardData.color == this.tableCard.color || cardData.value == this.tableCard.value;
            if ( !isValid ) return { success: false, reason: "card doesn't match" };
        }

        playerHand.splice( cardIndex, 1 );
        this.tableCard = cardData;

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

    public setPlayerHand( socketID: string, cards: Card[] ): void{
        // will not remove cards from drawing pile
        this.players[socketID] = cards;
        
        return;
    }
}