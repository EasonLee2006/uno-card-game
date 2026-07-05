import { Card, Gamestate, Player, GameRules } from "./types";
export declare class UnoGame {
    players: Record<string, Player>;
    state: "LOBBY" | "PLAYING" | "FINISHED";
    rules: GameRules;
    private deck;
    tableCards: Card[];
    setPlayerHand(socketID: string, cards: Card[]): void;
    turnOrder: string[];
    currentPlayerIndex: number;
    turnDirection: 1 | -1;
    getActivePlayerID(): string | undefined;
    getGameState(): Gamestate;
    constructor();
    private buildDeck;
    private shuffle;
    private getNextPlayerIndex;
    private handleTurnIndexOnDisconnection;
    private reverseTurnDirection;
    private dealCardsToPlayers;
    private checkCardPlayLegality;
    private removeCardsFromPlayer;
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
    startGame(): void;
    playcard(socketID: string, cards: Card[]): {
        success: boolean;
        reason?: string;
    };
    getGameStateSnapshot(): {
        turnOrder: string[];
        currentPlayerIndex: number;
        playDirection: 1 | -1;
        tableCard: Card[];
        deckSize: number;
        players: Record<string, Player>;
    };
}
//# sourceMappingURL=UnoGame.d.ts.map