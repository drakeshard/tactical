import type { LocationId } from "../core/identity.js";
import type { Topology } from "../space/topology.js";

export interface TraversalTransition {
  readonly from: LocationId;
  readonly to: LocationId;
  readonly cost: number;
}

export type TraversalPolicy = (from: LocationId, to: LocationId) => number | undefined;

export type TraversalResult =
  | {
      readonly kind: "transitions";
      readonly transitions: readonly TraversalTransition[];
    }
  | {
      readonly kind: "unknown-location";
      readonly location: LocationId;
    }
  | {
      readonly kind: "invalid-cost";
      readonly from: LocationId;
      readonly to: LocationId;
      readonly cost: number;
    };

function isValidTraversalCost(cost: number): boolean {
  return Number.isFinite(cost) && cost >= 0;
}

export function traversalTransitions(
  topology: Topology,
  from: LocationId,
  policy: TraversalPolicy,
): TraversalResult {
  const neighbors = topology.neighbors(from);
  if (neighbors === undefined) {
    return { kind: "unknown-location", location: from };
  }

  const transitions: TraversalTransition[] = [];
  for (const to of neighbors) {
    const cost = policy(from, to);
    if (cost === undefined) continue;
    if (!isValidTraversalCost(cost)) {
      return { kind: "invalid-cost", from, to, cost };
    }
    transitions.push({ from, to, cost });
  }

  return { kind: "transitions", transitions };
}
