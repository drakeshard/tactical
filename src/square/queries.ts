import type { LocationId } from "../core/identity.js";
import {
  squareChebyshevDistance,
  squareContains,
  squareLocationId,
  squareManhattanDistance,
  type SquareCoord,
  type SquareDirection,
  type SquareTopologyDefinition,
} from "./topology.js";

export type SquareDistanceMetric = "manhattan" | "chebyshev";
export type SquareRelativeDirection = SquareDirection | "same";

export function squareDistance(
  left: SquareCoord,
  right: SquareCoord,
  metric: SquareDistanceMetric,
): number {
  return metric === "manhattan"
    ? squareManhattanDistance(left, right)
    : squareChebyshevDistance(left, right);
}

export function squareRelativeDirection(
  from: SquareCoord,
  to: SquareCoord,
): SquareRelativeDirection {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);

  if (dx === 0 && dy === 0) return "same";
  if (dx === 0 && dy < 0) return "north";
  if (dx > 0 && dy < 0) return "north-east";
  if (dx > 0 && dy === 0) return "east";
  if (dx > 0 && dy > 0) return "south-east";
  if (dx === 0 && dy > 0) return "south";
  if (dx < 0 && dy > 0) return "south-west";
  if (dx < 0 && dy === 0) return "west";
  return "north-west";
}

export type SquareRadiusResult =
  | {
      readonly kind: "locations";
      readonly locations: readonly LocationId[];
    }
  | {
      readonly kind: "invalid-radius";
      readonly radius: number;
    }
  | {
      readonly kind: "outside-bounds";
      readonly center: SquareCoord;
    };

export function squareLocationsWithinRadius(
  definition: SquareTopologyDefinition,
  center: SquareCoord,
  radius: number,
  metric: SquareDistanceMetric,
): SquareRadiusResult {
  if (!Number.isSafeInteger(radius) || radius < 0) {
    return { kind: "invalid-radius", radius };
  }
  if (!squareContains(definition.bounds, center)) {
    return { kind: "outside-bounds", center };
  }

  const locations: LocationId[] = [];
  const { minX, maxX, minY, maxY } = definition.bounds;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const coord = { x, y };
      if (squareDistance(center, coord, metric) <= radius) {
        locations.push(squareLocationId(coord));
      }
    }
  }

  return { kind: "locations", locations };
}
