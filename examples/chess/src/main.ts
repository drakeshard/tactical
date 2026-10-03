import {
  algebraicCoord,
  applyMove,
  type ChessMove,
  type ChessState,
  type Color,
  createInitialState,
  gameStatus,
  legalMovesFrom,
  type PieceKind,
  type PromotionKind,
  pieceAtCoord,
} from "./chess.js";

const glyphs: Readonly<Record<Color, Readonly<Record<PieceKind, string>>>> = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
};

const boardElement = document.querySelector<HTMLDivElement>("#board");
const statusElement = document.querySelector<HTMLHeadingElement>("#status");
const resetElement = document.querySelector<HTMLButtonElement>("#reset");
const movesElement = document.querySelector<HTMLOListElement>("#moves");
const promotionElement = document.querySelector<HTMLSelectElement>("#promotion");

if (!boardElement || !statusElement || !resetElement || !movesElement || !promotionElement) {
  throw new Error("Chess UI mount missing");
}

const board = boardElement;
const status = statusElement;
const reset = resetElement;
const moves = movesElement;
const promotion = promotionElement;

let state: ChessState = createInitialState();
let selected: { x: number; y: number } | undefined;
let history: string[] = [];

function describeStatus(): string {
  const result = gameStatus(state);
  if (result.kind === "checkmate") return `Checkmate — ${result.winner} wins`;
  if (result.kind === "stalemate") return "Stalemate";

  const turn = `${result.turn[0]?.toUpperCase() ?? ""}${result.turn.slice(1)}`;
  return `${turn} to move${result.check ? " — check" : ""}`;
}

function legalAt(x: number, y: number): readonly ChessMove[] {
  return selected
    ? legalMovesFrom(state, selected).filter((move) => move.to.x === x && move.to.y === y)
    : [];
}

function preferredMove(candidates: readonly ChessMove[]): ChessMove | undefined {
  const preferredPromotion = promotion.value as PromotionKind;
  return (
    candidates.find((candidate) => candidate.promotion === preferredPromotion) ?? candidates[0]
  );
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
      button.setAttribute(
        "aria-label",
        piece
          ? `${algebraicCoord(coord)}, ${piece.color} ${piece.kind}`
          : `${algebraicCoord(coord)}, empty`,
      );

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
        const candidate = preferredMove(legal);

        if (selected && candidate) {
          const before = pieceAtCoord(state, selected);
          const next = applyMove(state, candidate);

          if (next && before) {
            const promotionSuffix = candidate.promotion
              ? `=${candidate.promotion[0]?.toUpperCase()}`
              : "";
            history.push(`${algebraicCoord(selected)}–${algebraicCoord(coord)}${promotionSuffix}`);
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

  moves.replaceChildren(
    ...history.map((entry) => {
      const item = document.createElement("li");
      item.textContent = entry;
      return item;
    }),
  );
}

reset.addEventListener("click", () => {
  state = createInitialState();
  selected = undefined;
  history = [];
  render();
});

render();
