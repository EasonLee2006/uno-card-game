import { Card, Gamestate } from "./types";
export declare class UnoGame {
    private deck;
    private tableCard;
    getTableCard(): Card | undefined;
    setTableCard(cardData: Card): void;
    private players;
    getPlayers(): Record<string, Card[]>;
    setPlayerHand(socketID: string, cards: Card[]): void;
    private turnOrder;
    private currentTurnIndex;
    private turnDirection;
    getActivePlayerID(): string | undefined;
    getGameState(): Gamestate;
    private totalPenalty;
    getTotalPenalty(): number;
    constructor();
    private buildDeck;
    private shuffle;
    private getNextPlayerIndex;
    private handleTurnIndexOnDisconnection;
    private reverseTurnDirection;
    addPlayerAndDealCards(socketID: string): Card[];
    removePlayer(socketID: string): void;
    tryPlayCard(socketID: string, cardData: Card): {
        success: boolean;
        reason?: string;
        affectedPlayers: {
            socketID: string;
            action: string;
        }[];
    };
    forceDrawCard(socketID: string, num: number): {
        success: boolean;
        reason?: string;
        cards: Card[];
    };
    tryDrawCard(socketID: string): {
        success: boolean;
        reason?: string;
        cardData?: Card;
    };
}
//# sourceMappingURL=UnoGame.d.ts.map