import { CardColor, Card } from "./types";

export function buildDeck(){
    const colors: CardColor[] = ["red", "blue", "green", "yellow"];
    const values: string[] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "turn", "+2"];

    let newDeck: Card[] = [];

    for(let color of colors){
        for(let value of values){
            newDeck.push( { color: color, value: value } );
            if( value == "0" ) continue; // only 1 zero in each color

            newDeck.push( { color: color, value: value } );
        }
    }
    return newDeck;
}

export function shuffle( cardDeck: Card[] ){
    for(let i = cardDeck.length-1 ; i>0 ; i--){
        const j = Math.floor(Math.random() * (i + 1));

        [ cardDeck[i], cardDeck[j] ] = [ cardDeck[j]!, cardDeck[i]! ];
    }
}

export function removeCardOnce(arr: Card[], card: Card): boolean{
    const index = arr.findIndex( (c) => { return c.color === card.color && c.value === card.value } );
    if( index > -1 ){
        arr.splice(index, 1);
        console.log("removed card from hand", card);
        return true;
    }else{
        console.log("cannot find card to remove");
        return false;
    }
}

export function isCardPlayValid( card: Card, tableCard: Card | undefined ): boolean{
    if(tableCard == null){ return true; }
    return( card.color == tableCard.color || card.value == tableCard.value );
}

export function isCheating( playerHand: Card[], card: Card ): boolean{
    const index = playerHand.findIndex( (c) => { return c.color === card.color && c.value === card.value } );
    if(index < 0){
        return true;
    }
    else return false;
}