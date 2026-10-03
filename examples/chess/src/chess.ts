import { tacticalEntityId, type TacticalEntityId } from "../../../src/core/identity.js";
import {
  emptyPlacementState,
  occupantsAt,
  placeEntity,
  relocateEntity,
  removeEntity,
  type PlacementState,
} from "../../../src/placement/placement.js";
import {
  createSquareTopology,
  parseSquareLocationId,
  squareContains,
  squareLocationId,
  type SquareCoord,
  type SquareTopologyDefinition,
} from "../../../src/square/topology.js";
import { squareLineTrace } from "../../../src/visibility/square-los.js";

export type Color = "white" | "black";
export type PieceKind = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
export type PromotionKind = "queen" | "rook" | "bishop" | "knight";

export interface ChessPiece {
  readonly id: TacticalEntityId;
  readonly color: Color;
  readonly kind: PieceKind;
}

export interface CastlingRights {
  readonly whiteKingSide: boolean;
  readonly whiteQueenSide: boolean;
  readonly blackKingSide: boolean;
  readonly blackQueenSide: boolean;
}

export interface ChessState {
  readonly pieces: readonly ChessPiece[];
  readonly placement: PlacementState;
  readonly turn: Color;
  readonly castling: CastlingRights;
  readonly enPassantTarget?: SquareCoord;
  readonly halfmove: number;
  readonly fullmove: number;
}

export interface ChessMove {
  readonly from: SquareCoord;
  readonly to: SquareCoord;
  readonly promotion?: PromotionKind;
}

export type GameStatus =
  | { readonly kind: "active"; readonly turn: Color; readonly check: boolean }
  | { readonly kind: "checkmate"; readonly winner: Color }
  | { readonly kind: "stalemate"; readonly turn: Color };

const BOARD: SquareTopologyDefinition = {
  bounds: { minX: 0, maxX: 7, minY: 0, maxY: 7 },
  adjacency: "eight",
};

const createdTopology = createSquareTopology(BOARD);
if (!createdTopology) throw new Error("Chess board topology is invalid");
const topology = createdTopology;

const PIECE_ORDER: readonly PieceKind[] = [
  "rook",
  "knight",
  "bishop",
  "queen",
  "king",
  "bishop",
  "knight",
  "rook",
];

function other(color: Color): Color {
  return color === "white" ? "black" : "white";
}

function sameCoord(a: SquareCoord, b: SquareCoord): boolean {
  return a.x === b.x && a.y === b.y;
}

function pieceById(state: ChessState, id: TacticalEntityId): ChessPiece | undefined {
  return state.pieces.find((piece) => piece.id === id);
}

function pieceAt(state: ChessState, coord: SquareCoord): ChessPiece | undefined {
  const [id] = occupantsAt(state.placement, squareLocationId(coord));
  return id ? pieceById(state, id) : undefined;
}

function coordOf(state: ChessState, piece: ChessPiece): SquareCoord | undefined {
  const placement = state.placement.placements.find((entry) => entry.entity === piece.id);
  const [location] = placement?.locations ?? [];
  return location ? parseSquareLocationId(location) : undefined;
}

function isEmpty(state: ChessState, coord: SquareCoord): boolean {
  return pieceAt(state, coord) === undefined;
}

function makePiece(color: Color, kind: PieceKind, suffix: string): ChessPiece {
  return { id: tacticalEntityId(`chess:${color}:${kind}:${suffix}`), color, kind };
}

export function createInitialState(): ChessState {
  const pieces: ChessPiece[] = [];
  let placement = emptyPlacementState();

  const add = (piece: ChessPiece, coord: SquareCoord) => {
    pieces.push(piece);
    const result = placeEntity(placement, topology, piece.id, [squareLocationId(coord)]);
    if (result.kind !== "placed") throw new Error("Initial chess placement failed");
    placement = result.state;
  };

  for (let x = 0; x < 8; x += 1) {
    const kind = PIECE_ORDER[x];
    if (!kind) throw new Error("Invalid back-rank fixture");
    add(makePiece("black", kind, String(x)), { x, y: 0 });
    add(makePiece("black", "pawn", String(x)), { x, y: 1 });
    add(makePiece("white", "pawn", String(x)), { x, y: 6 });
    add(makePiece("white", kind, String(x)), { x, y: 7 });
  }

  return {
    pieces,
    placement,
    turn: "white",
    castling: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    },
    halfmove: 0,
    fullmove: 1,
  };
}

export function createState(
  pieces: readonly {
    readonly color: Color;
    readonly kind: PieceKind;
    readonly coord: SquareCoord;
    readonly id: string;
  }[],
  turn: Color = "white",
  castling: CastlingRights = {
    whiteKingSide: false,
    whiteQueenSide: false,
    blackKingSide: false,
    blackQueenSide: false,
  },
  enPassantTarget?: SquareCoord,
): ChessState {
  let placement = emptyPlacementState();
  const mapped: ChessPiece[] = [];

  for (const item of pieces) {
    const piece: ChessPiece = {
      id: tacticalEntityId(item.id),
      color: item.color,
      kind: item.kind,
    };
    mapped.push(piece);

    const result = placeEntity(placement, topology, piece.id, [squareLocationId(item.coord)]);
    if (result.kind !== "placed") throw new Error("Fixture placement failed");
    placement = result.state;
  }

  return {
    pieces: mapped,
    placement,
    turn,
    castling,
    ...(enPassantTarget ? { enPassantTarget } : {}),
    halfmove: 0,
    fullmove: 1,
  };
}

function structuralClear(state: ChessState, from: SquareCoord, to: SquareCoord): boolean {
  const trace = squareLineTrace(from, to);
  return trace.slice(1, -1).every((coord) => isEmpty(state, coord));
}

function canLand(
  state: ChessState,
  piece: ChessPiece,
  to: SquareCoord,
  attacksOnly: boolean,
): boolean {
  if (!squareContains(BOARD.bounds, to)) return false;
  if (attacksOnly) return true;

  const target = pieceAt(state, to);
  return target === undefined || (target.color !== piece.color && target.kind !== "king");
}

function pseudoMovesForPiece(
  state: ChessState,
  piece: ChessPiece,
  attacksOnly = false,
): SquareCoord[] {
  const from = coordOf(state, piece);
  if (!from) return [];

  const moves: SquareCoord[] = [];
  const add = (to: SquareCoord) => {
    if (canLand(state, piece, to, attacksOnly)) moves.push(to);
  };

  if (piece.kind === "knight") {
    for (const [dx, dy] of [
      [1, 2],
      [2, 1],
      [2, -1],
      [1, -2],
      [-1, -2],
      [-2, -1],
      [-2, 1],
      [-1, 2],
    ] as const) {
      add({ x: from.x + dx, y: from.y + dy });
    }
    return moves;
  }

  if (piece.kind === "king") {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx !== 0 || dy !== 0) add({ x: from.x + dx, y: from.y + dy });
      }
    }

    if (!attacksOnly) {
      for (const castle of castleTargets(state, piece)) moves.push(castle);
    }
    return moves;
  }

  if (piece.kind === "pawn") {
    const direction = piece.color === "white" ? -1 : 1;

    for (const dx of [-1, 1]) {
      const capture = { x: from.x + dx, y: from.y + direction };
      if (!squareContains(BOARD.bounds, capture)) continue;

      if (attacksOnly) {
        moves.push(capture);
        continue;
      }

      const target = pieceAt(state, capture);
      if (target && target.color !== piece.color && target.kind !== "king") {
        moves.push(capture);
        continue;
      }

      if (state.enPassantTarget && sameCoord(state.enPassantTarget, capture)) {
        const adjacent = pieceAt(state, { x: capture.x, y: from.y });
        if (adjacent?.kind === "pawn" && adjacent.color !== piece.color) {
          moves.push(capture);
        }
      }
    }

    if (attacksOnly) return moves;

    const one = { x: from.x, y: from.y + direction };
    if (squareContains(BOARD.bounds, one) && isEmpty(state, one)) {
      moves.push(one);

      const startRank = piece.color === "white" ? 6 : 1;
      const two = { x: from.x, y: from.y + 2 * direction };
      if (from.y === startRank && isEmpty(state, two)) moves.push(two);
    }
    return moves;
  }

  const directions: readonly (readonly [number, number])[] =
    piece.kind === "rook"
      ? [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]
      : piece.kind === "bishop"
        ? [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ]
        : [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ];

  for (const [dx, dy] of directions) {
    for (let distance = 1; distance < 8; distance += 1) {
      const to = { x: from.x + dx * distance, y: from.y + dy * distance };
      if (!squareContains(BOARD.bounds, to)) break;
      if (!structuralClear(state, from, to)) break;

      const target = pieceAt(state, to);
      if (!target) {
        moves.push(to);
        continue;
      }

      if (attacksOnly || (target.color !== piece.color && target.kind !== "king")) {
        moves.push(to);
      }
      break;
    }
  }

  return moves;
}

function isSquareAttacked(state: ChessState, coord: SquareCoord, by: Color): boolean {
  return state.pieces
    .filter((piece) => piece.color === by)
    .some((piece) =>
      pseudoMovesForPiece(state, piece, true).some((move) => sameCoord(move, coord)),
    );
}

function kingCoord(state: ChessState, color: Color): SquareCoord | undefined {
  const king = state.pieces.find((piece) => piece.color === color && piece.kind === "king");
  return king ? coordOf(state, king) : undefined;
}

export function isInCheck(state: ChessState, color: Color): boolean {
  const king = kingCoord(state, color);
  return king ? isSquareAttacked(state, king, other(color)) : false;
}

function castleTargets(state: ChessState, king: ChessPiece): SquareCoord[] {
  const from = coordOf(state, king);
  if (!from || king.kind !== "king") return [];

  const y = king.color === "white" ? 7 : 0;
  if (from.x !== 4 || from.y !== y || isInCheck(state, king.color)) return [];

  const rights =
    king.color === "white"
      ? [state.castling.whiteKingSide, state.castling.whiteQueenSide]
      : [state.castling.blackKingSide, state.castling.blackQueenSide];

  const results: SquareCoord[] = [];
  const enemy = other(king.color);

  if (rights[0]) {
    const rook = pieceAt(state, { x: 7, y });
    if (
      rook?.kind === "rook" &&
      rook.color === king.color &&
      isEmpty(state, { x: 5, y }) &&
      isEmpty(state, { x: 6, y }) &&
      !isSquareAttacked(state, { x: 5, y }, enemy) &&
      !isSquareAttacked(state, { x: 6, y }, enemy)
    ) {
      results.push({ x: 6, y });
    }
  }

  if (rights[1]) {
    const rook = pieceAt(state, { x: 0, y });
    if (
      rook?.kind === "rook" &&
      rook.color === king.color &&
      isEmpty(state, { x: 1, y }) &&
      isEmpty(state, { x: 2, y }) &&
      isEmpty(state, { x: 3, y }) &&
      !isSquareAttacked(state, { x: 3, y }, enemy) &&
      !isSquareAttacked(state, { x: 2, y }, enemy)
    ) {
      results.push({ x: 2, y });
    }
  }

  return results;
}

function applyUnchecked(state: ChessState, move: ChessMove): ChessState | undefined {
  const piece = pieceAt(state, move.from);
  if (!piece) return undefined;

  let pieces = [...state.pieces];
  let placement = state.placement;
  const target = pieceAt(state, move.to);
  let captured = target;

  if (
    piece.kind === "pawn" &&
    !target &&
    state.enPassantTarget &&
    sameCoord(state.enPassantTarget, move.to) &&
    move.from.x !== move.to.x
  ) {
    const captureCoord = { x: move.to.x, y: move.from.y };
    const adjacent = pieceAt(state, captureCoord);
    if (adjacent?.kind !== "pawn" || adjacent.color === piece.color) return undefined;
    captured = adjacent;
  }

  if (captured) {
    if (captured.color === piece.color || captured.kind === "king") return undefined;

    const removed = removeEntity(placement, captured.id);
    if (removed.kind !== "removed") return undefined;
    placement = removed.state;
    pieces = pieces.filter((entry) => entry.id !== captured.id);
  }

  const relocated = relocateEntity(placement, topology, piece.id, [squareLocationId(move.to)]);
  if (relocated.kind !== "relocated") return undefined;
  placement = relocated.state;

  const castlingMove = piece.kind === "king" && Math.abs(move.to.x - move.from.x) === 2;
  if (castlingMove) {
    const y = move.from.y;
    const rookFrom = move.to.x === 6 ? { x: 7, y } : { x: 0, y };
    const rookTo = move.to.x === 6 ? { x: 5, y } : { x: 3, y };
    const rook = pieceAt({ ...state, pieces, placement }, rookFrom);
    if (!rook || rook.kind !== "rook" || rook.color !== piece.color) return undefined;

    const rookMoved = relocateEntity(placement, topology, rook.id, [squareLocationId(rookTo)]);
    if (rookMoved.kind !== "relocated") return undefined;
    placement = rookMoved.state;
  }

  const promotionRank = piece.color === "white" ? 0 : 7;
  if (piece.kind === "pawn" && move.to.y === promotionRank) {
    const promotion = move.promotion ?? "queen";
    pieces = pieces.map((entry) =>
      entry.id === piece.id ? { ...entry, kind: promotion } : entry,
    );
  }

  let castling = { ...state.castling };

  if (piece.kind === "king") {
    if (piece.color === "white") {
      castling = { ...castling, whiteKingSide: false, whiteQueenSide: false };
    } else {
      castling = { ...castling, blackKingSide: false, blackQueenSide: false };
    }
  }

  if (piece.kind === "rook") {
    if (piece.color === "white" && move.from.y === 7) {
      if (move.from.x === 0) castling = { ...castling, whiteQueenSide: false };
      if (move.from.x === 7) castling = { ...castling, whiteKingSide: false };
    }
    if (piece.color === "black" && move.from.y === 0) {
      if (move.from.x === 0) castling = { ...castling, blackQueenSide: false };
      if (move.from.x === 7) castling = { ...castling, blackKingSide: false };
    }
  }

  if (captured?.kind === "rook") {
    const capturedCoord = coordOf(state, captured);

    if (captured.color === "white" && capturedCoord?.y === 7) {
      if (capturedCoord.x === 0) castling = { ...castling, whiteQueenSide: false };
      if (capturedCoord.x === 7) castling = { ...castling, whiteKingSide: false };
    }

    if (captured.color === "black" && capturedCoord?.y === 0) {
      if (capturedCoord.x === 0) castling = { ...castling, blackQueenSide: false };
      if (capturedCoord.x === 7) castling = { ...castling, blackKingSide: false };
    }
  }

  const enPassantTarget =
    piece.kind === "pawn" && Math.abs(move.to.y - move.from.y) === 2
      ? { x: move.from.x, y: (move.from.y + move.to.y) / 2 }
      : undefined;

  const pawnOrCapture = piece.kind === "pawn" || captured !== undefined;

  return {
    pieces,
    placement,
    turn: other(state.turn),
    castling,
    ...(enPassantTarget ? { enPassantTarget } : {}),
    halfmove: pawnOrCapture ? 0 : state.halfmove + 1,
    fullmove: state.fullmove + (state.turn === "black" ? 1 : 0),
  };
}

export function legalMovesFrom(state: ChessState, from: SquareCoord): readonly ChessMove[] {
  const piece = pieceAt(state, from);
  if (!piece || piece.color !== state.turn) return [];

  return pseudoMovesForPiece(state, piece).flatMap((to) => {
    const promotions: readonly PromotionKind[] =
      piece.kind === "pawn" && (to.y === 0 || to.y === 7)
        ? ["queen", "rook", "bishop", "knight"]
        : [];

    const candidates: ChessMove[] =
      promotions.length > 0
        ? promotions.map((promotion) => ({ from, to, promotion }))
        : [{ from, to }];

    return candidates.filter((move) => {
      const next = applyUnchecked(state, move);
      return next !== undefined && !isInCheck(next, piece.color);
    });
  });
}

export function allLegalMoves(state: ChessState): readonly ChessMove[] {
  return state.pieces
    .filter((piece) => piece.color === state.turn)
    .flatMap((piece) => {
      const coord = coordOf(state, piece);
      return coord ? legalMovesFrom(state, coord) : [];
    });
}

export function applyMove(state: ChessState, move: ChessMove): ChessState | undefined {
  const legal = legalMovesFrom(state, move.from).find(
    (candidate) =>
      sameCoord(candidate.to, move.to) &&
      (candidate.promotion ?? "queen") === (move.promotion ?? "queen"),
  );

  return legal ? applyUnchecked(state, legal) : undefined;
}

export function gameStatus(state: ChessState): GameStatus {
  const moves = allLegalMoves(state);
  const check = isInCheck(state, state.turn);

  if (moves.length > 0) return { kind: "active", turn: state.turn, check };
  if (check) return { kind: "checkmate", winner: other(state.turn) };
  return { kind: "stalemate", turn: state.turn };
}

export function pieceAtCoord(state: ChessState, coord: SquareCoord): ChessPiece | undefined {
  return pieceAt(state, coord);
}

export function serializeChess(state: ChessState): string {
  const pieces = state.pieces
    .map((piece) => {
      const coord = coordOf(state, piece);
      if (!coord) throw new Error("Unplaced chess piece");
      return { id: piece.id, color: piece.color, kind: piece.kind, coord };
    })
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  return JSON.stringify({
    pieces,
    turn: state.turn,
    castling: state.castling,
    ...(state.enPassantTarget ? { enPassantTarget: state.enPassantTarget } : {}),
    halfmove: state.halfmove,
    fullmove: state.fullmove,
  });
}

export function algebraicCoord(coord: SquareCoord): string {
  return `${String.fromCharCode(97 + coord.x)}${8 - coord.y}`;
}
