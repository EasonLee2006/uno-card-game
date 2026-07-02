export type CardColor = "red" | "blue" | "green" | "yellow";
export interface Card {
    color: CardColor;
    value: string;
}
export interface Gamestate {
    tableCard: Card | undefined;
    activePlayerID: string | undefined;
}
export interface Player {
    id: string;
    name: string;
    hand: Card[];
    isHost: boolean;
}
export interface GameRules {
    stackDrawTwo: boolean;
    playMultipleMatches: boolean;
    addBots: boolean;
}
//# sourceMappingURL=types.d.ts.map