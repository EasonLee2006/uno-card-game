import { Card } from "./types";
export declare class UnoGame {
    private deck;
    private tableCard;
    getTableCard(): Card | undefined;
    setTableCard(cardData: Card): void;
    private players;
    getPlayers(): Record<string, Card[]>;
    constructor();
    private buildDeck;
    private shuffle;
    addPlayerAndDealCards(socketID: string): Card[];
    removePlayer(socketID: string): void;
    tryPlayCard(socketID: string, cardData: Card): {
        success: boolean;
        reason?: string;
    };
    drawCard(socketID: string): Card | null;
    setPlayerHand(socketID: string, cards: Card[]): void;
}
//# sourceMappingURL=UnoGame.d.ts.map