import type { LocationId } from "../core/identity.js";
import {
  squareRelativeDirection,
  type SquareRelativeDirection,
} from "../square/queries.js";
import {
  squareLocationId,
  type SquareCoord,
  type SquareDirection,
  type SquareTopologyDefinition,
} from "../square/topology.js";
import {
  squareLineOfSight,
  type SquareLineOfSightObservation,
  type VisionBlocker,
} from "../visibility/square-los.js";

export type SquareCoverProvider = (
  target: LocationId,
  directionFromTarget: SquareDirection,
) => boolean;

export interface SquareCoverObservation {
  readonly observer: LocationId;
  readonly target: LocationId;
  readonly directionFromTarget: SquareRelativeDirection;
  readonly covered: boolean;
  readonly lineOfSight: SquareLineOfSightObservation;
}

export type SquareCoverResult =
  | {
      readonly kind: "observed";
      readonly observation: SquareCoverObservation;
    }
  | {
      readonly kind: "not-visible";
      readonly lineOfSight: SquareLineOfSightObservation;
    }
  | {
      readonly kind: "outside-bounds";
      readonly endpoint: "from" | "to";
      readonly coord: SquareCoord;
    };

export function observeSquareCover(
  definition: SquareTopologyDefinition,
  observer: SquareCoord,
  target: SquareCoord,
  blocksVision: VisionBlocker,
  providesCover: SquareCoverProvider,
): SquareCoverResult {
  const line = squareLineOfSight(definition, observer, target, blocksVision);
  if (line.kind === "outside-bounds") return line;
  if (!line.observation.visible) {
    return { kind: "not-visible", lineOfSight: line.observation };
  }

  const observerId = squareLocationId(observer);
  const targetId = squareLocationId(target);
  const directionFromTarget = squareRelativeDirection(target, observer);
  const covered =
    directionFromTarget === "same" ? false : providesCover(targetId, directionFromTarget);

  return {
    kind: "observed",
    observation: {
      observer: observerId,
      target: targetId,
      directionFromTarget,
      covered,
      lineOfSight: line.observation,
    },
  };
}
