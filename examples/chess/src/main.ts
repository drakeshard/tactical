import { type AiDifficulty, chooseAiMove } from "./ai.js";
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
import {
  type ChessClock,
  createClock,
  elapseClock,
  formatClock,
  hasTimedOut,
  type TimeControl,
} from "./clock.js";

type GameMode = "local" | "ai";

interface GameConfig {
  readonly mode: GameMode;
  readonly difficulty: AiDifficulty;
  readonly humanSide: Color;
  readonly timeControl: TimeControl;
}

const glyphs: Readonly<Record<Color, Readonly<Record<PieceKind, string>>>> = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
};

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Chess UI mount missing: ${selector}`);
  return element;
}

const board = requireElement<HTMLDivElement>("#board");
const status = requireElement<HTMLParagraphElement>("#status");
const moves = requireElement<HTMLOListElement>("#moves");
const promotion = requireElement<HTMLSelectElement>("#promotion");
const moveCount = requireElement<HTMLSpanElement>("#move-count");
const turnDot = requireElement<HTMLSpanElement>("#turn-dot");
const mode = requireElement<HTMLSelectElement>("#mode");
const difficulty = requireElement<HTMLSelectElement>("#difficulty");
const humanSide = requireElement<HTMLSelectElement>("#human-side");
const timeControl = requireElement<HTMLSelectElement>("#time-control");
const aiSettings = requireElement<HTMLDivElement>("#ai-settings");
const newGame = requireElement<HTMLButtonElement>("#new-game");
const newGameTop = requireElement<HTMLButtonElement>("#new-game-top");
const modeSummary = requireElement<HTMLSpanElement>("#mode-summary");
const whitePlayer = requireElement<HTMLDivElement>("#white-player");
const blackPlayer = requireElement<HTMLDivElement>("#black-player");
const whiteClockElement = requireElement<HTMLTimeElement>("#white-clock");
const blackClockElement = requireElement<HTMLTimeElement>("#black-clock");
const whiteRole = requireElement<HTMLSpanElement>("#white-role");
const blackRole = requireElement<HTMLSpanElement>("#black-role");

let state: ChessState = createInitialState();
let selected: { x: number; y: number } | undefined;
let history: string[] = [];
let lastMove: ChessMove | undefined;
let clock: ChessClock = createClock("5");
let timedOut: Color | undefined;
let aiPending = false;
let session = 0;
let lastFrame = performance.now();
let config: GameConfig = {
  mode: "local",
  difficulty: "normal",
  humanSide: "white",
  timeControl: "5",
};

function opposite(color: Color): Color {
  return color === "white" ? "black" : "white";
}

function titleCase(color: Color): string {
  return `${color[0]?.toUpperCase() ?? ""}${color.slice(1)}`;
}

function currentStatus(): string {
  if (timedOut) return `${titleCase(opposite(timedOut))} wins on time`;

  const result = gameStatus(state);
  if (result.kind === "checkmate") return `Checkmate · ${titleCase(result.winner)} wins`;
  if (result.kind === "stalemate") return "Stalemate";
  if (aiPending) return `${titleCase(result.turn)} · AI thinking`;
  return `${titleCase(result.turn)} to move${result.check ? " · Check" : ""}`;
}

function isGameActive(): boolean {
  return timedOut === undefined && gameStatus(state).kind === "active";
}

function isAiTurn(): boolean {
  return config.mode === "ai" && state.turn !== config.humanSide;
}

function canHumanInteract(): boolean {
  return isGameActive() && !aiPending && !isAiTurn();
}

function legalAt(x: number, y: number): readonly ChessMove[] {
  if (!selected) return [];
  return legalMovesFrom(state, selected).filter((move) => move.to.x === x && move.to.y === y);
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

function sameSquare(
  a: { readonly x: number; readonly y: number },
  b: { readonly x: number; readonly y: number },
): boolean {
  return a.x === b.x && a.y === b.y;
}

function describeMove(move: ChessMove): string {
  const promotionSuffix = move.promotion ? `=${move.promotion[0]?.toUpperCase() ?? ""}` : "";
  return `${algebraicCoord(move.from)}–${algebraicCoord(move.to)}${promotionSuffix}`;
}

function applyGameMove(move: ChessMove): boolean {
  const next = applyMove(state, move);
  if (!next) return false;

  state = next;
  lastMove = move;
  history = [...history, describeMove(move)];
  selected = undefined;
  lastFrame = performance.now();
  return true;
}

function renderPlayers(): void {
  const activeColor = state.turn;
  whitePlayer.classList.toggle("active", activeColor === "white" && isGameActive());
  blackPlayer.classList.toggle("active", activeColor === "black" && isGameActive());
  whitePlayer.classList.toggle("inactive", activeColor !== "white" && isGameActive());
  blackPlayer.classList.toggle("inactive", activeColor !== "black" && isGameActive());

  if (config.mode === "local") {
    whiteRole.textContent = "Local player";
    blackRole.textContent = "Local player";
  } else {
    whiteRole.textContent = config.humanSide === "white" ? "You" : `AI · ${config.difficulty}`;
    blackRole.textContent = config.humanSide === "black" ? "You" : `AI · ${config.difficulty}`;
  }
}

function renderClocks(): void {
  whiteClockElement.textContent = formatClock(clock.whiteMs);
  blackClockElement.textContent = formatClock(clock.blackMs);
  whiteClockElement.classList.toggle(
    "danger",
    clock.whiteMs !== null && clock.whiteMs > 0 && clock.whiteMs <= 30_000,
  );
  blackClockElement.classList.toggle(
    "danger",
    clock.blackMs !== null && clock.blackMs > 0 && clock.blackMs <= 30_000,
  );
}

function renderBoard(): void {
  board.replaceChildren();

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

      if (selected && sameSquare(selected, coord)) button.classList.add("selected");
      if (lastMove && (sameSquare(lastMove.from, coord) || sameSquare(lastMove.to, coord))) {
        button.classList.add("last-move");
      }

      const legal = canHumanInteract() ? legalAt(x, y) : [];
      if (legal.length > 0) button.classList.add(piece ? "capture" : "legal");

      appendEdgeLabels(button, x, y);

      if (piece) {
        const glyph = document.createElement("span");
        glyph.className = `piece piece-${piece.color}`;
        glyph.textContent = glyphs[piece.color][piece.kind];
        button.append(glyph);
      }

      button.addEventListener("click", () => {
        if (!canHumanInteract()) return;

        const candidate = preferredMove(legal);
        if (selected && candidate) {
          if (applyGameMove(candidate)) {
            render();
            scheduleAiIfNeeded();
          }
          return;
        }

        if (piece?.color === state.turn) {
          selected = coord;
        } else {
          selected = undefined;
        }
        renderBoard();
      });

      board.append(button);
    }
  }
}

function renderHistory(): void {
  moveCount.textContent = String(history.length);
  moves.replaceChildren(
    ...history.map((entry) => {
      const item = document.createElement("li");
      item.textContent = entry;
      return item;
    }),
  );

  const last = moves.lastElementChild;
  if (last instanceof HTMLElement) last.scrollIntoView({ block: "nearest" });
}

function render(): void {
  status.textContent = currentStatus();
  turnDot.classList.toggle("black", state.turn === "black");
  renderPlayers();
  renderClocks();
  renderBoard();
  renderHistory();
}

function scheduleAiIfNeeded(): void {
  if (!isGameActive() || !isAiTurn() || aiPending) return;

  aiPending = true;
  selected = undefined;
  render();
  const scheduledSession = session;

  window.setTimeout(() => {
    if (scheduledSession !== session || !isGameActive() || !isAiTurn()) {
      aiPending = false;
      return;
    }

    const move = chooseAiMove(state, config.difficulty);
    aiPending = false;
    if (move) applyGameMove(move);
    render();
  }, 220);
}

function updateSetupVisibility(): void {
  aiSettings.hidden = mode.value !== "ai";
}

function readConfig(): GameConfig {
  return {
    mode: mode.value as GameMode,
    difficulty: difficulty.value as AiDifficulty,
    humanSide: humanSide.value as Color,
    timeControl: timeControl.value as TimeControl,
  };
}

function configSummary(value: GameConfig): string {
  const time = value.timeControl === "unlimited" ? "Unlimited" : `${value.timeControl} min`;
  if (value.mode === "local") return `Local · ${time}`;
  return `AI ${value.difficulty} · ${time}`;
}

function startNewGame(): void {
  session += 1;
  config = readConfig();
  state = createInitialState();
  selected = undefined;
  history = [];
  lastMove = undefined;
  clock = createClock(config.timeControl);
  timedOut = undefined;
  aiPending = false;
  lastFrame = performance.now();
  modeSummary.textContent = configSummary(config);
  render();
  scheduleAiIfNeeded();
}

function tick(now: number): void {
  const elapsed = Math.max(0, now - lastFrame);
  lastFrame = now;

  if (isGameActive()) {
    clock = elapseClock(clock, state.turn, elapsed);
    if (hasTimedOut(clock, state.turn)) {
      timedOut = state.turn;
      selected = undefined;
      aiPending = false;
      session += 1;
      render();
    } else {
      renderClocks();
    }
  }

  requestAnimationFrame(tick);
}

mode.addEventListener("change", updateSetupVisibility);
newGame.addEventListener("click", startNewGame);
newGameTop.addEventListener("click", startNewGame);

updateSetupVisibility();
startNewGame();
requestAnimationFrame((now) => {
  lastFrame = now;
  requestAnimationFrame(tick);
});
