import type { LocationId } from "../core/identity.js";
import type { Topology } from "../space/topology.js";
import { type TraversalPolicy, traversalTransitions } from "../traversal/traversal.js";

export interface ReachableLocation {
  readonly location: LocationId;
  readonly cost: number;
}

export type ReachabilityResult =
  | {
      readonly kind: "reachable";
      readonly locations: readonly ReachableLocation[];
    }
  | {
      readonly kind: "invalid-budget";
      readonly budget: number;
    }
  | {
      readonly kind: "unknown-location";
      readonly location: LocationId;
    }
  | {
      readonly kind: "invalid-transition-cost";
      readonly from: LocationId;
      readonly to: LocationId;
      readonly cost: number;
    };

interface PendingLocation {
  readonly location: LocationId;
  readonly cost: number;
  readonly sequence: number;
}

function takeNext(pending: PendingLocation[]): PendingLocation | undefined {
  if (pending.length === 0) return undefined;

  let bestIndex = 0;
  for (let index = 1; index < pending.length; index += 1) {
    const candidate = pending[index];
    const best = pending[bestIndex];
    if (!candidate || !best) continue;

    if (
      candidate.cost < best.cost ||
      (candidate.cost === best.cost && candidate.sequence < best.sequence)
    ) {
      bestIndex = index;
    }
  }

  return pending.splice(bestIndex, 1)[0];
}

export function reachableLocations(
  topology: Topology,
  start: LocationId,
  budget: number,
  policy: TraversalPolicy,
): ReachabilityResult {
  if (!Number.isFinite(budget) || budget < 0) {
    return { kind: "invalid-budget", budget };
  }
  if (!topology.hasLocation(start)) {
    return { kind: "unknown-location", location: start };
  }

  const bestCost = new Map<LocationId, number>([[start, 0]]);
  const finalized = new Set<LocationId>();
  const pending: PendingLocation[] = [{ location: start, cost: 0, sequence: 0 }];
  const locations: ReachableLocation[] = [];
  let sequence = 1;

  while (pending.length > 0) {
    const current = takeNext(pending);
    if (!current) break;

    if (finalized.has(current.location)) continue;
    if (bestCost.get(current.location) !== current.cost) continue;

    finalized.add(current.location);
    locations.push({ location: current.location, cost: current.cost });

    const transitions = traversalTransitions(topology, current.location, policy);
    if (transitions.kind === "unknown-location") {
      return transitions;
    }
    if (transitions.kind === "invalid-cost") {
      return {
        kind: "invalid-transition-cost",
        from: transitions.from,
        to: transitions.to,
        cost: transitions.cost,
      };
    }

    for (const transition of transitions.transitions) {
      const nextCost = current.cost + transition.cost;
      if (nextCost > budget) continue;

      const previous = bestCost.get(transition.to);
      if (previous !== undefined && previous <= nextCost) continue;

      bestCost.set(transition.to, nextCost);
      pending.push({ location: transition.to, cost: nextCost, sequence });
      sequence += 1;
    }
  }

  return { kind: "reachable", locations };
}
