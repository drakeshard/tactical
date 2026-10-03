import { describe, expect, it } from "vitest";
import { chooseAiMove } from "../src/ai.js";
import { applyMove, createInitialState, createState, gameStatus } from "../src/chess.js";
import { createClock, elapseClock, formatClock, hasTimedOut } from "../src/clock.js";

describe("chess sample AI", () => {
  it("is deterministic for the same position and difficulty", () => {
    const state = createInitialState();
    expect(chooseAiMove(state, "hard")).toEqual(chooseAiMove(state, "hard"));
  });

  it("finds a mate-in-one on hard difficulty", () => {
    const state = createState([
      { id: "wk", color: "white", kind: "king", coord: { x: 5, y: 2 } },
      { id: "wq", color: "white", kind: "queen", coord: { x: 6, y: 2 } },
      { id: "bk", color: "black", kind: "king", coord: { x: 7, y: 0 } },
    ]);

    const move = chooseAiMove(state, "hard");
    expect(move).toBeDefined();
    if (!move) throw new Error("expected mating move");

    const next = applyMove(state, move);
    expect(next ? gameStatus(next) : undefined).toEqual({
      kind: "checkmate",
      winner: "white",
    });
  });

  it("takes an immediately valuable capture on easy difficulty", () => {
    const state = createState([
      { id: "wk", color: "white", kind: "king", coord: { x: 7, y: 7 } },
      { id: "wr", color: "white", kind: "rook", coord: { x: 0, y: 7 } },
      { id: "bk", color: "black", kind: "king", coord: { x: 7, y: 0 } },
      { id: "bq", color: "black", kind: "queen", coord: { x: 0, y: 0 } },
    ]);

    expect(chooseAiMove(state, "easy")).toMatchObject({
      from: { x: 0, y: 7 },
      to: { x: 0, y: 0 },
    });
  });
});

describe("chess sample clock", () => {
  it("creates and advances finite clocks only for the active side", () => {
    const initial = createClock("5");
    const advanced = elapseClock(initial, "white", 1_500);

    expect(initial).toEqual({ whiteMs: 300_000, blackMs: 300_000 });
    expect(advanced).toEqual({ whiteMs: 298_500, blackMs: 300_000 });
  });

  it("supports unlimited time and timeout clamping", () => {
    const unlimited = createClock("unlimited");
    expect(elapseClock(unlimited, "black", 50_000)).toEqual(unlimited);
    expect(formatClock(unlimited.whiteMs)).toBe("∞");

    const timed = elapseClock({ whiteMs: 400, blackMs: 1_000 }, "white", 800);
    expect(timed.whiteMs).toBe(0);
    expect(hasTimedOut(timed, "white")).toBe(true);
    expect(formatClock(timed.whiteMs)).toBe("0:00");
  });

  it("formats finite time by ceiling partial seconds", () => {
    expect(formatClock(299_001)).toBe("5:00");
    expect(formatClock(298_999)).toBe("4:59");
  });
});
