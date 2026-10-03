import { describe, expect, it } from "vitest";
import {
  allLegalMoves,
  applyMove,
  createInitialState,
  createState,
  gameStatus,
  isInCheck,
  legalMovesFrom,
  serializeChess,
} from "../src/chess.js";

describe("chess Tactical integration sample", () => {
  it("starts with the standard twenty legal moves", () => {
    expect(allLegalMoves(createInitialState())).toHaveLength(20);
  });

  it("keeps sliding movement blocked by Tactical-backed occupancy", () => {
    const state = createInitialState();
    expect(legalMovesFrom(state, { x: 0, y: 7 })).toHaveLength(0);
  });

  it("detects Fool's Mate as checkmate", () => {
    let state = createInitialState();
    for (const move of [
      { from: { x: 5, y: 6 }, to: { x: 5, y: 5 } },
      { from: { x: 4, y: 1 }, to: { x: 4, y: 3 } },
      { from: { x: 6, y: 6 }, to: { x: 6, y: 4 } },
      { from: { x: 3, y: 0 }, to: { x: 7, y: 4 } },
    ]) {
      const next = applyMove(state, move);
      expect(next).toBeDefined();
      if (!next) throw new Error("expected legal fixture move");
      state = next;
    }
    expect(isInCheck(state, "white")).toBe(true);
    expect(gameStatus(state)).toEqual({ kind: "checkmate", winner: "black" });
  });

  it("supports legal king-side castling while keeping castling chess-owned", () => {
    const state = createState(
      [
        { id: "wk", color: "white", kind: "king", coord: { x: 4, y: 7 } },
        { id: "wr", color: "white", kind: "rook", coord: { x: 7, y: 7 } },
        { id: "bk", color: "black", kind: "king", coord: { x: 4, y: 0 } },
      ],
      "white",
      { whiteKingSide: true, whiteQueenSide: false, blackKingSide: false, blackQueenSide: false },
    );
    const move = legalMovesFrom(state, { x: 4, y: 7 }).find((entry) => entry.to.x === 6 && entry.to.y === 7);
    expect(move).toBeDefined();
    const next = move ? applyMove(state, move) : undefined;
    expect(serializeChess(next ?? state)).toContain('"id":"wr"');
    expect(serializeChess(next ?? state)).toContain('"x":5,"y":7');
  });

  it("supports en passant capture", () => {
    const state = createState(
      [
        { id: "wk", color: "white", kind: "king", coord: { x: 4, y: 7 } },
        { id: "wp", color: "white", kind: "pawn", coord: { x: 4, y: 3 } },
        { id: "bk", color: "black", kind: "king", coord: { x: 4, y: 0 } },
        { id: "bp", color: "black", kind: "pawn", coord: { x: 3, y: 3 } },
      ],
      "white",
      undefined,
      { x: 3, y: 2 },
    );
    const move = legalMovesFrom(state, { x: 4, y: 3 }).find((entry) => entry.to.x === 3 && entry.to.y === 2);
    expect(move).toBeDefined();
    const next = move ? applyMove(state, move) : undefined;
    expect(next?.pieces.some((piece) => piece.id === "bp")).toBe(false);
  });

  it("supports deterministic promotion choices", () => {
    const state = createState([
      { id: "wk", color: "white", kind: "king", coord: { x: 4, y: 7 } },
      { id: "wp", color: "white", kind: "pawn", coord: { x: 0, y: 1 } },
      { id: "bk", color: "black", kind: "king", coord: { x: 4, y: 0 } },
    ]);
    const promotions = legalMovesFrom(state, { x: 0, y: 1 }).filter((entry) => entry.to.x === 0 && entry.to.y === 0);
    expect(promotions.map((entry) => entry.promotion)).toEqual(["queen", "rook", "bishop", "knight"]);
    const knight = promotions.find((entry) => entry.promotion === "knight");
    const next = knight ? applyMove(state, knight) : undefined;
    expect(next?.pieces.find((piece) => piece.id === "wp")?.kind).toBe("knight");
  });

  it("detects stalemate", () => {
    const state = createState(
      [
        { id: "wk", color: "white", kind: "king", coord: { x: 2, y: 2 } },
        { id: "wq", color: "white", kind: "queen", coord: { x: 1, y: 2 } },
        { id: "bk", color: "black", kind: "king", coord: { x: 0, y: 0 } },
      ],
      "black",
    );
    expect(gameStatus(state)).toEqual({ kind: "stalemate", turn: "black" });
  });

  it("replays identical moves into byte-identical serialized state", () => {
    const run = () => {
      let state = createInitialState();
      for (const move of [
        { from: { x: 4, y: 6 }, to: { x: 4, y: 4 } },
        { from: { x: 4, y: 1 }, to: { x: 4, y: 3 } },
        { from: { x: 6, y: 7 }, to: { x: 5, y: 5 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
      ]) {
        const next = applyMove(state, move);
        if (!next) throw new Error("expected deterministic fixture move");
        state = next;
      }
      return serializeChess(state);
    };
    expect(run()).toBe(run());
  });
});
