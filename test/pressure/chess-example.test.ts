import { describe, expect, it } from "vitest";

import {
  allLegalMoves,
  applyMove,
  createInitialState,
  createState,
  gameStatus,
  legalMovesFrom,
  serializeChess,
} from "../../examples/chess/src/chess.js";

describe("chess as a materially different Tactical consumer", () => {
  it("uses Tactical placement/topology while keeping normal chess movement game-owned", () => {
    const state = createInitialState();

    expect(allLegalMoves(state)).toHaveLength(20);
    expect(legalMovesFrom(state, { x: 0, y: 7 })).toHaveLength(0);
    expect(legalMovesFrom(state, { x: 1, y: 7 }).map((move) => move.to)).toEqual([
      { x: 2, y: 5 },
      { x: 0, y: 5 },
    ]);
  });

  it("replays an opening identically", () => {
    const run = () => {
      let state = createInitialState();
      for (const move of [
        { from: { x: 4, y: 6 }, to: { x: 4, y: 4 } },
        { from: { x: 4, y: 1 }, to: { x: 4, y: 3 } },
        { from: { x: 6, y: 7 }, to: { x: 5, y: 5 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
      ]) {
        const next = applyMove(state, move);
        if (!next) throw new Error("expected legal opening move");
        state = next;
      }
      return serializeChess(state);
    };

    expect(run()).toBe(run());
  });

  it("keeps checkmate and stalemate semantics in the sample", () => {
    let mate = createInitialState();
    for (const move of [
      { from: { x: 5, y: 6 }, to: { x: 5, y: 5 } },
      { from: { x: 4, y: 1 }, to: { x: 4, y: 3 } },
      { from: { x: 6, y: 6 }, to: { x: 6, y: 4 } },
      { from: { x: 3, y: 0 }, to: { x: 7, y: 4 } },
    ]) {
      const next = applyMove(mate, move);
      if (!next) throw new Error("expected legal mating move");
      mate = next;
    }
    expect(gameStatus(mate)).toEqual({ kind: "checkmate", winner: "black" });

    const stalemate = createState(
      [
        { id: "wk", color: "white", kind: "king", coord: { x: 2, y: 2 } },
        { id: "wq", color: "white", kind: "queen", coord: { x: 1, y: 2 } },
        { id: "bk", color: "black", kind: "king", coord: { x: 0, y: 0 } },
      ],
      "black",
    );
    expect(gameStatus(stalemate)).toEqual({ kind: "stalemate", turn: "black" });
  });
});
