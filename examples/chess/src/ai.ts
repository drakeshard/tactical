import {
  allLegalMoves,
  applyMove,
  type ChessMove,
  type ChessState,
  type Color,
  gameStatus,
  isInCheck,
  type PieceKind,
  pieceAtCoord,
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

const searchConfig: Readonly<
  Record<AiDifficulty, { readonly depth: number; readonly nodeCap: number }>
> = {
  easy: { depth: 1, nodeCap: 220 },
  normal: { depth: 2, nodeCap: 5_000 },
  hard: { depth: 3, nodeCap: 28_000 },
};

function moveKey(move: ChessMove): string {
  return [move.from.y, move.from.x, move.to.y, move.to.x, move.promotion ?? ""].join(":");
}

function pieceAtMoveTarget(state: ChessState, move: ChessMove) {
  return pieceAtCoord(state, move.to);
}

function movePriority(state: ChessState, move: ChessMove): number {
  const mover = pieceAtCoord(state, move.from);
  const target = pieceAtMoveTarget(state, move);
  let score = 0;

  if (target && mover) {
    score += 10_000 + pieceValues[target.kind] * 10 - pieceValues[mover.kind];
  }

  if (move.promotion) score += 8_000 + pieceValues[move.promotion];

  const next = applyMove(state, move);
  if (next) {
    const status = gameStatus(next);
    if (status.kind === "checkmate") score += 1_000_000;
    else if (isInCheck(next, next.turn)) score += 5_000;
  }

  const centerDistance = Math.abs(3.5 - move.to.x) + Math.abs(3.5 - move.to.y);
  score += Math.round((7 - centerDistance) * 4);
  return score;
}

function sortedMoves(state: ChessState): readonly ChessMove[] {
  return [...allLegalMoves(state)].sort((a, b) => {
    const priority = movePriority(state, b) - movePriority(state, a);
    return priority !== 0 ? priority : moveKey(a).localeCompare(moveKey(b));
  });
}

function materialScore(state: ChessState, perspective: Color): number {
  return state.pieces.reduce((score, piece) => {
    const value = pieceValues[piece.kind];
    return score + (piece.color === perspective ? value : -value);
  }, 0);
}

function positionalScore(state: ChessState, perspective: Color): number {
  let score = 0;

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const piece = pieceAtCoord(state, { x, y });
      if (!piece) continue;

      const sign = piece.color === perspective ? 1 : -1;
      const centerDistance = Math.abs(3.5 - x) + Math.abs(3.5 - y);
      const centerBonus = Math.round((7 - centerDistance) * 3);

      if (piece.kind === "knight" || piece.kind === "bishop" || piece.kind === "queen") {
        score += sign * centerBonus;
      }

      if (piece.kind === "pawn") {
        const progress = piece.color === "white" ? 6 - y : y - 1;
        score += sign * Math.max(0, progress) * 8;
      }

      if (piece.kind === "king") {
        const homeRank = piece.color === "white" ? 7 : 0;
        const homeDistance = Math.abs(homeRank - y);
        score -= sign * homeDistance * 10;
      }
    }
  }

  return score;
}

function mobilityScore(state: ChessState, perspective: Color): number {
  const current = allLegalMoves(state).length;
  const signed = state.turn === perspective ? current : -current;
  return signed * 3;
}

function pressureScore(state: ChessState, perspective: Color): number {
  let score = 0;
  if (isInCheck(state, perspective)) score -= 45;
  if (isInCheck(state, perspective === "white" ? "black" : "white")) score += 45;
  return score;
}

function evaluate(state: ChessState, perspective: Color): number {
  return (
    materialScore(state, perspective) +
    positionalScore(state, perspective) +
    mobilityScore(state, perspective) +
    pressureScore(state, perspective)
  );
}

function evaluateTerminal(state: ChessState, perspective: Color, ply: number): number | undefined {
  const status = gameStatus(state);
  if (status.kind === "stalemate") return 0;
  if (status.kind === "checkmate") {
    const mateScore = 100_000 - ply;
    return status.winner === perspective ? mateScore : -mateScore;
  }
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
  ply: number,
): number {
  const terminal = evaluateTerminal(state, perspective, ply);
  if (terminal !== undefined) return terminal;
  if (depth === 0 || budget.nodes >= budget.cap) return evaluate(state, perspective);

  budget.nodes += 1;
  const maximizing = state.turn === perspective;
  let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (const move of sortedMoves(state)) {
    if (budget.nodes >= budget.cap) break;
    const next = applyMove(state, move);
    if (!next) continue;

    const score = search(next, depth - 1, perspective, alpha, beta, budget, ply + 1);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }

    if (beta <= alpha) break;
  }

  return Number.isFinite(best) ? best : evaluate(state, perspective);
}

export function chooseAiMove(state: ChessState, difficulty: AiDifficulty): ChessMove | undefined {
  const config = searchConfig[difficulty];
  const moves = sortedMoves(state);
  if (moves.length === 0) return undefined;

  const firstMove = moves[0];
  if (!firstMove) return undefined;

  const perspective = state.turn;
  const budget: SearchBudget = { nodes: 0, cap: config.nodeCap };
  let bestMove = firstMove;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const move of moves) {
    if (budget.nodes >= budget.cap) break;
    const next = applyMove(state, move);
    if (!next) continue;

    const terminal = evaluateTerminal(next, perspective, 1);
    const score =
      terminal ??
      search(
        next,
        Math.max(0, config.depth - 1),
        perspective,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        budget,
        1,
      );

    if (score > bestScore || (score === bestScore && moveKey(move) < moveKey(bestMove))) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
