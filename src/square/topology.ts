import { locationId, type LocationId } from "../core/identity.js";
import type { Topology } from "../space/topology.js";

export interface SquareCoord {
  readonly x: number;
  readonly y: number;
}

export interface SquareBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export type SquareAdjacency = "four" | "eight";

export interface SquareTopologyDefinition {
  readonly bounds: SquareBounds;
  readonly adjacency: SquareAdjacency;
}

export type SquareDirection =
  | "north"
  | "north-east"
  | "east"
  | "south-east"
  | "south"
  | "south-west"
  | "west"
  | "north-west";

const FOUR_DIRECTIONS: readonly SquareDirection[] = ["north", "east", "south", "west"];
const EIGHT_DIRECTIONS: readonly SquareDirection[] = [
  "north",
  "north-east",
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
];

const DELTAS: Readonly<Record<SquareDirection, SquareCoord>> = {
  north: { x: 0, y: -1 },
  "north-east": { x: 1, y: -1 },
  east: { x: 1, y: 0 },
  "south-east": { x: 1, y: 1 },
  south: { x: 0, y: 1 },
  "south-west": { x: -1, y: 1 },
  west: { x: -1, y: 0 },
  "north-west": { x: -1, y: -1 },
};

export function squareLocationId(coord: SquareCoord): LocationId {
  return locationId(`square:${coord.x},${coord.y}`);
}

export function parseSquareLocationId(id: LocationId): SquareCoord | undefined {
  const match = /^square:(-?\d+),(-?\d+)$/.exec(id);
  if (!match) return undefined;

  const x = Number(match[1]);
  const y = Number(match[2]);
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) return undefined;
  return { x, y };
}

export function squareDirections(adjacency: SquareAdjacency): readonly SquareDirection[] {
  return adjacency === "four" ? FOUR_DIRECTIONS : EIGHT_DIRECTIONS;
}

export function squareNeighbor(coord: SquareCoord, direction: SquareDirection): SquareCoord {
  const delta = DELTAS[direction];
  return { x: coord.x + delta.x, y: coord.y + delta.y };
}

export function squareContains(bounds: SquareBounds, coord: SquareCoord): boolean {
  return (
    Number.isSafeInteger(coord.x) &&
    Number.isSafeInteger(coord.y) &&
    coord.x >= bounds.minX &&
    coord.x <= bounds.maxX &&
    coord.y >= bounds.minY &&
    coord.y <= bounds.maxY
  );
}

export function squareManhattanDistance(left: SquareCoord, right: SquareCoord): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

export function squareChebyshevDistance(left: SquareCoord, right: SquareCoord): number {
  return Math.max(Math.abs(left.x - right.x), Math.abs(left.y - right.y));
}

export function isValidSquareDefinition(definition: SquareTopologyDefinition): boolean {
  const { minX, maxX, minY, maxY } = definition.bounds;
  return (
    Number.isSafeInteger(minX) &&
    Number.isSafeInteger(maxX) &&
    Number.isSafeInteger(minY) &&
    Number.isSafeInteger(maxY) &&
    minX <= maxX &&
    minY <= maxY
  );
}

export function createSquareTopology(definition: SquareTopologyDefinition): Topology | undefined {
  if (!isValidSquareDefinition(definition)) return undefined;

  return {
    hasLocation(location) {
      const coord = parseSquareLocationId(location);
      return coord !== undefined && squareContains(definition.bounds, coord);
    },
    neighbors(location) {
      const coord = parseSquareLocationId(location);
      if (coord === undefined || !squareContains(definition.bounds, coord)) return undefined;

      return squareDirections(definition.adjacency)
        .map((direction) => squareNeighbor(coord, direction))
        .filter((neighbor) => squareContains(definition.bounds, neighbor))
        .map(squareLocationId);
    },
  };
}
