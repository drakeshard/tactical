import type { LocationId } from "../core/identity.js";
import type { Topology } from "../space/topology.js";
import { type TraversalPolicy, traversalTransitions } from "../traversal/traversal.js";

export interface TacticalPath {
  readonly locations: readonly LocationId[];
  readonly cost: number;
}

export type PathfindingResult =
  | {
      readonly kind: "path";
      readonly path: TacticalPath;
    }
  | {
      readonly kind: "unreachable";
      readonly start: LocationId;
      readonly goal: LocationId;
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

function reconstructPath(
  start: LocationId,
  goal: LocationId,
  predecessor: ReadonlyMap<LocationId, LocationId>,
): readonly LocationId[] {
  const reversed: LocationId[] = [goal];
  let current = goal;

  while (current !== start) {
    const previous = predecessor.get(current);
    if (previous === undefined) return [];
    reversed.push(previous);
    current = previous;
  }

  return reversed.reverse();
}

export function lowestCostPath(
  topology: Topology,
  start: LocationId,
  goal: LocationId,
  policy: TraversalPolicy,
): PathfindingResult {
  if (!topology.hasLocation(start)) return { kind: "unknown-location", location: start };
  if (!topology.hasLocation(goal)) return { kind: "unknown-location", location: goal };
  if (start === goal) return { kind: "path", path: { locations: [start], cost: 0 } };

  const bestCost = new Map<LocationId, number>([[start, 0]]);
  const predecessor = new Map<LocationId, LocationId>();
  const finalized = new Set<LocationId>();
  const pending: PendingLocation[] = [{ location: start, cost: 0, sequence: 0 }];
  let sequence = 1;

  while (pending.length > 0) {
    const current = takeNext(pending);
    if (!current) break;

    if (finalized.has(current.location)) continue;
    if (bestCost.get(current.location) !== current.cost) continue;
    finalized.add(current.location);

    if (current.location === goal) {
      return {
        kind: "path",
        path: {
          locations: reconstructPath(start, goal, predecessor),
          cost: current.cost,
        },
      };
    }

    const transitions = traversalTransitions(topology, current.location, policy);
    if (transitions.kind === "unknown-location") return transitions;
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
      if (!Number.isFinite(nextCost)) {
        return {
          kind: "invalid-transition-cost",
          from: transition.from,
          to: transition.to,
          cost: nextCost,
        };
      }

      const previous = bestCost.get(transition.to);
      if (previous !== undefined && previous <= nextCost) continue;

      bestCost.set(transition.to, nextCost);
      predecessor.set(transition.to, current.location);
      pending.push({ location: transition.to, cost: nextCost, sequence });
      sequence += 1;
    }
  }

  return { kind: "unreachable", start, goal };
}
