import { UnoGame } from "./UnoGame";
import { Card } from "./types";

describe("UnoGame Logic", ()=>{
    let game: UnoGame;

    beforeEach(()=>{
        game = new UnoGame();
    });

    test("starting hands should have 7 cards", ()=>{
        const socketID: string = "player-1";

        const startingHand: Card[] = game.addPlayerAndDealCards( socketID );

        expect( startingHand.length ).toBe(7);
        expect( game.getPlayers()[socketID] ).toBeDefined();
        expect( game.getPlayers()[socketID]?.length ).toBe(7);
    });

    test("should reject card if player doesn't own the card", ()=>{
        const socketID: string = "hacker-2";

        game.setPlayerHand(  socketID, [ {color: "yellow", value: "skip"} ]);

        const fakeCard: Card = {color: "red", value: "skip"};

        const result = game.tryPlayCard( socketID, fakeCard );

        expect(result.success).toBe(false);
        expect(result.reason).toBe("cannot find card in hand");
    });
});