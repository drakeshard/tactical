import type { LocationId } from "../core/identity.js";
import {
  type SquareCoord,
  type SquareTopologyDefinition,
  squareContains,
  squareLocationId,
} from "../square/topology.js";

export interface SquareLineOfSightObservation {
  readonly visible: boolean;
  readonly trace: readonly LocationId[];
  readonly blockingLocation?: LocationId;
}

export type SquareLineOfSightResult =
  | {
      readonly kind: "observed";
      readonly observation: SquareLineOfSightObservation;
    }
  | {
      readonly kind: "outside-bounds";
      readonly endpoint: "from" | "to";
      readonly coord: SquareCoord;
    };

export type VisionBlocker = (location: LocationId) => boolean;

export function squareLineTrace(from: SquareCoord, to: SquareCoord): readonly SquareCoord[] {
  let x = from.x;
  let y = from.y;
  const dx = Math.abs(to.x - from.x);
  const sx = from.x < to.x ? 1 : -1;
  const dy = -Math.abs(to.y - from.y);
  const sy = from.y < to.y ? 1 : -1;
  let error = dx + dy;
  const trace: SquareCoord[] = [];

  while (true) {
    trace.push({ x, y });
    if (x === to.x && y === to.y) break;

    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      x += sx;
    }
    if (doubled <= dx) {
      error += dx;
      y += sy;
    }
  }

  return trace;
}

export function squareLineOfSight(
  definition: SquareTopologyDefinition,
  from: SquareCoord,
  to: SquareCoord,
  blocksVision: VisionBlocker,
): SquareLineOfSightResult {
  if (!squareContains(definition.bounds, from)) {
    return { kind: "outside-bounds", endpoint: "from", coord: from };
  }
  if (!squareContains(definition.bounds, to)) {
    return { kind: "outside-bounds", endpoint: "to", coord: to };
  }

  const trace = squareLineTrace(from, to).map(squareLocationId);
  for (const location of trace.slice(1, -1)) {
    if (blocksVision(location)) {
      return {
        kind: "observed",
        observation: {
          visible: false,
          trace,
          blockingLocation: location,
        },
      };
    }
  }

  return {
    kind: "observed",
    observation: {
      visible: true,
      trace,
    },
  };
}
