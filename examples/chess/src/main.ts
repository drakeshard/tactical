import {
  algebraicCoord,
  applyMove,
  createInitialState,
  gameStatus,
  legalMovesFrom,
  pieceAtCoord,
  type ChessMove,
  type ChessState,
  type Color,
  type PieceKind,
} from "./chess.js";

const glyphs: Readonly<Record<Color, Readonly<Record<PieceKind, string>>>> = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
};

const board = document.querySelector<HTMLDivElement>("#board");
const status = document.querySelector<HTMLHeadingElement>("#status");
const reset = document.querySelector<HTMLButtonElement>("#reset");
const moves = document.querySelector<HTMLOListElement>("#moves");
if (!board || !status || !reset || !moves) throw new Error("Chess UI mount missing");

let state: ChessState = createInitialState();
let selected: { x: number; y: number } | undefined;
let history: string[] = [];

function describeStatus(): string {
  const result = gameStatus(state);
  if (result.kind === "checkmate") return `Checkmate — ${result.winner} wins`;
  if (result.kind === "stalemate") return "Stalemate";
  return `${result.turn[0]?.toUpperCase() ?? ""}${result.turn.slice(1)} to move${result.check ? " — check" : ""}`;
}

function legalAt(x: number, y: number): readonly ChessMove[] {
  return selected ? legalMovesFrom(state, selected).filter((move) => move.to.x === x && move.to.y === y) : [];
}

function render(): void {
  board.replaceChildren();
  status.textContent = describeStatus();

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const coord = { x, y };
      const piece = pieceAtCoord(state, coord);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `square ${(x + y) % 2 === 0 ? "light" : "dark"}`;
      button.setAttribute("aria-label", algebraicCoord(coord));
      if (selected?.x === x && selected.y === y) button.classList.add("selected");
      const legal = legalAt(x, y);
      if (legal.length > 0) button.classList.add(piece ? "capture" : "legal");

      const label = document.createElement("span");
      label.className = "coord";
      label.textContent = algebraicCoord(coord);
      button.append(label);

      if (piece) {
        const glyph = document.createElement("span");
        glyph.textContent = glyphs[piece.color][piece.kind];
        button.append(glyph);
      }

      button.addEventListener("click", () => {
        const candidate = legal[0];
        if (selected && candidate) {
          const before = pieceAtCoord(state, selected);
          const next = applyMove(state, { ...candidate, promotion: candidate.promotion ?? "queen" });
          if (next && before) {
            history.push(`${algebraicCoord(selected)}–${algebraicCoord(coord)}${candidate.promotion ? `=${candidate.promotion[0]?.toUpperCase()}` : ""}`);
            state = next;
            selected = undefined;
          }
        } else if (piece?.color === state.turn) {
          selected = coord;
        } else {
          selected = undefined;
        }
        render();
      });

      board.append(button);
    }
  }

  moves.replaceChildren(...history.map((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    return item;
  }));
}

reset.addEventListener("click", () => {
  state = createInitialState();
  selected = undefined;
  history = [];
  render();
});

render();
