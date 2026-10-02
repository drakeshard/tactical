import type { LocationId } from "../core/identity.js";

/**
 * Minimal relational topology contract.
 *
 * Implementations define which logical locations exist and the deterministic
 * order of directly related neighbor locations. The contract intentionally
 * does not imply coordinates, movement cost, traversal capability, visibility,
 * or a generic graph data model.
 */
export interface Topology {
  hasLocation(location: LocationId): boolean;
  neighbors(location: LocationId): readonly LocationId[] | undefined;
}

export type TopologyNeighborsResult =
  | {
      readonly kind: "found";
      readonly locations: readonly LocationId[];
    }
  | {
      readonly kind: "unknown-location";
      readonly location: LocationId;
    };

export function topologyHasLocation(topology: Topology, location: LocationId): boolean {
  return topology.hasLocation(location);
}

export function topologyNeighbors(
  topology: Topology,
  location: LocationId,
): TopologyNeighborsResult {
  const locations = topology.neighbors(location);
  if (locations === undefined) {
    return { kind: "unknown-location", location };
  }

  return {
    kind: "found",
    locations,
  };
}
