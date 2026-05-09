import { Card } from "./types";
export declare function buildDeck(): Card[];
export declare function shuffle(cardDeck: Card[]): void;
export declare function removeCardOnce(arr: Card[], card: Card): boolean;
export declare function isCardPlayValid(card: Card, tableCard: Card | undefined): boolean;
export declare function isCheating(playerHand: Card[], card: Card): boolean;
//# sourceMappingURL=gameLogic.d.ts.map