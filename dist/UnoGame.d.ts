import { Card, Gamestate, Player, GameRules } from "./types";
export declare class UnoGame {
    players: Record<string, Player>;
    state: "LOBBY" | "PLAYING" | "FINISHED";
    rules: GameRules;
    private deck;
    tableCard: Card | undefined;
    setPlayerHand(socketID: string, cards: Card[]): void;
    turnOrder: string[];
    currentPlayerIndex: number;
    turnDirection: 1 | -1;
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
    addPlayer(socketId: string, playerName: string): void;
    getLobbyData(): {
        players: {
            id: string;
            name: string;
            isHost: boolean;
        }[];
        rules: GameRules;
    };
    removePlayer(socketId: string): void;
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
    getGameStateSnapshot(): {
        turnOrder: string[];
        currentPlayerIndex: number;
        playDirection: 1 | -1;
        tableCard: Card | undefined;
        deckSize: number;
        players: Record<string, Player>;
    };
}
//# sourceMappingURL=UnoGame.d.ts.map