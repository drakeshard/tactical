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
const statusElement = document.querySelector<HTMLParagraphElement>("#status");
const resetElement = document.querySelector<HTMLButtonElement>("#reset");
const movesElement = document.querySelector<HTMLOListElement>("#moves");
const promotionElement = document.querySelector<HTMLSelectElement>("#promotion");
const moveCountElement = document.querySelector<HTMLSpanElement>("#move-count");
const turnIndicatorElement = document.querySelector<HTMLSpanElement>("#turn-indicator");

if (
  !boardElement ||
  !statusElement ||
  !resetElement ||
  !movesElement ||
  !promotionElement ||
  !moveCountElement ||
  !turnIndicatorElement
) {
  throw new Error("Chess UI mount missing");
}

const board = boardElement;
const status = statusElement;
const reset = resetElement;
const moves = movesElement;
const promotion = promotionElement;
const moveCount = moveCountElement;
const turnIndicator = turnIndicatorElement;

let state: ChessState = createInitialState();
let selected: { x: number; y: number } | undefined;
let history: string[] = [];

function describeStatus(): string {
  const result = gameStatus(state);
  if (result.kind === "checkmate") return "Checkmate · " + result.winner + " wins";
  if (result.kind === "stalemate") return "Stalemate";

  const turn = (result.turn[0]?.toUpperCase() ?? "") + result.turn.slice(1);
  return turn + " to move" + (result.check ? " · Check" : "");
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

function appendEdgeLabels(button: HTMLButtonElement, x: number, y: number): void {
  if (x === 0) {
    const rank = document.createElement("span");
    rank.className = "edge-label rank-label";
    rank.textContent = String(8 - y);
    button.append(rank);
  }

  if (y === 7) {
    const file = document.createElement("span");
    file.className = "edge-label file-label";
    file.textContent = String.fromCharCode(97 + x);
    button.append(file);
  }
}

function render(): void {
  board.replaceChildren();
  status.textContent = describeStatus();
  moveCount.textContent = String(history.length);
  turnIndicator.classList.toggle("black", state.turn === "black");

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const coord = { x, y };
      const piece = pieceAtCoord(state, coord);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "square " + ((x + y) % 2 === 0 ? "light" : "dark");
      button.setAttribute(
        "aria-label",
        piece
          ? algebraicCoord(coord) + ", " + piece.color + " " + piece.kind
          : algebraicCoord(coord) + ", empty",
      );

      if (selected?.x === x && selected.y === y) button.classList.add("selected");

      const legal = legalAt(x, y);
      if (legal.length > 0) button.classList.add(piece ? "capture" : "legal");

      appendEdgeLabels(button, x, y);

      if (piece) {
        const glyph = document.createElement("span");
        glyph.className = "piece piece-" + piece.color;
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
              ? "=" + (candidate.promotion[0]?.toUpperCase() ?? "")
              : "";
            history.push(
              algebraicCoord(selected) + "–" + algebraicCoord(coord) + promotionSuffix,
            );
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

  const lastMove = moves.lastElementChild;
  if (lastMove instanceof HTMLElement) lastMove.scrollIntoView({ block: "nearest" });
}

reset.addEventListener("click", () => {
  state = createInitialState();
  selected = undefined;
  history = [];
  render();
});

render();
