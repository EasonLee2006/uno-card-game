export type CardColor = "red"| "blue"| "green"| "yellow";

export interface Card {
    color: CardColor;
    value: string;
};

export interface Gamestate{
    tableCard: Card | undefined;
    activePlayerID: string | undefined;
}