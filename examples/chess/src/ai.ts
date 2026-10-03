import {
  allLegalMoves,
  applyMove,
  gameStatus,
  type ChessMove,
  type ChessState,
  type Color,
  type PieceKind,
} from "./chess.js";

export type AiDifficulty = "easy" | "normal" | "hard";

const pieceValues: Readonly<Record<PieceKind, number>> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 0,
};

const searchConfig: Readonly<Record<AiDifficulty, { readonly depth: number; readonly nodeCap: number }>> =
  {
    easy: { depth: 1, nodeCap: 96 },
    normal: { depth: 2, nodeCap: 1800 },
    hard: { depth: 3, nodeCap: 12000 },
  };

function moveKey(move: ChessMove): string {
  return [
    move.from.y,
    move.from.x,
    move.to.y,
    move.to.x,
    move.promotion ?? "",
  ].join(":");
}

function sortedMoves(state: ChessState): readonly ChessMove[] {
  return [...allLegalMoves(state)].sort((a, b) => moveKey(a).localeCompare(moveKey(b)));
}

function evaluateMaterial(state: ChessState, perspective: Color): number {
  return state.pieces.reduce((score, piece) => {
    const value = pieceValues[piece.kind];
    return score + (piece.color === perspective ? value : -value);
  }, 0);
}

function evaluateTerminal(state: ChessState, perspective: Color): number | undefined {
  const status = gameStatus(state);
  if (status.kind === "stalemate") return 0;
  if (status.kind === "checkmate") return status.winner === perspective ? 100000 : -100000;
  return undefined;
}

interface SearchBudget {
  nodes: number;
  readonly cap: number;
}

function search(
  state: ChessState,
  depth: number,
  perspective: Color,
  alpha: number,
  beta: number,
  budget: SearchBudget,
): number {
  const terminal = evaluateTerminal(state, perspective);
  if (terminal !== undefined) return terminal;
  if (depth === 0 || budget.nodes >= budget.cap) return evaluateMaterial(state, perspective);

  budget.nodes += 1;
  const maximizing = state.turn === perspective;
  let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (const move of sortedMoves(state)) {
    if (budget.nodes >= budget.cap) break;
    const next = applyMove(state, move);
    if (!next) continue;

    const score = search(next, depth - 1, perspective, alpha, beta, budget);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }

    if (beta <= alpha) break;
  }

  if (!Number.isFinite(best)) return evaluateMaterial(state, perspective);
  return best;
}

export function chooseAiMove(
  state: ChessState,
  difficulty: AiDifficulty,
): ChessMove | undefined {
  const config = searchConfig[difficulty];
  const moves = sortedMoves(state);
  if (moves.length === 0) return undefined;

  const perspective = state.turn;
  const budget: SearchBudget = { nodes: 0, cap: config.nodeCap };
  let bestMove = moves[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const move of moves) {
    if (budget.nodes >= budget.cap) break;
    const next = applyMove(state, move);
    if (!next) continue;

    const score = search(
      next,
      Math.max(0, config.depth - 1),
      perspective,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      budget,
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
