import type { LocationId, TacticalEntityId } from "../core/identity.js";
import type { Topology } from "../space/topology.js";

export interface Placement {
  readonly entity: TacticalEntityId;
  readonly locations: readonly LocationId[];
}

export interface PlacementState {
  readonly placements: readonly Placement[];
}

export interface OccupancyConflict {
  readonly kind: "occupancy-conflict";
  readonly location: LocationId;
  readonly occupants: readonly TacticalEntityId[];
}

export interface PlacementPolicyContext {
  readonly state: PlacementState;
  readonly entity: TacticalEntityId;
  readonly locations: readonly LocationId[];
}

export type PlacementPolicy = (context: PlacementPolicyContext) => OccupancyConflict | undefined;

export type PlacementRejected =
  | { readonly kind: "entity-already-placed"; readonly entity: TacticalEntityId }
  | { readonly kind: "entity-not-placed"; readonly entity: TacticalEntityId }
  | { readonly kind: "empty-location-set"; readonly entity: TacticalEntityId }
  | { readonly kind: "duplicate-location"; readonly location: LocationId }
  | { readonly kind: "unknown-location"; readonly location: LocationId }
  | OccupancyConflict;

export type PlacementResult =
  | { readonly kind: "placed"; readonly state: PlacementState }
  | { readonly kind: "relocated"; readonly state: PlacementState }
  | { readonly kind: "removed"; readonly state: PlacementState }
  | { readonly kind: "rejected"; readonly reason: PlacementRejected };

export function emptyPlacementState(): PlacementState {
  return { placements: [] };
}

export function locationsOf(
  state: PlacementState,
  entity: TacticalEntityId,
): readonly LocationId[] | undefined {
  return state.placements.find((placement) => placement.entity === entity)?.locations;
}

export function occupantsAt(
  state: PlacementState,
  location: LocationId,
): readonly TacticalEntityId[] {
  return state.placements
    .filter((placement) => placement.locations.includes(location))
    .map((placement) => placement.entity);
}

export function exclusiveOccupancyPolicy(
  context: PlacementPolicyContext,
): OccupancyConflict | undefined {
  for (const location of context.locations) {
    const occupants = occupantsAt(context.state, location);
    if (occupants.length > 0) {
      return { kind: "occupancy-conflict", location, occupants };
    }
  }
  return undefined;
}

function validateLocations(
  topology: Topology,
  entity: TacticalEntityId,
  locations: readonly LocationId[],
): PlacementRejected | undefined {
  if (locations.length === 0) return { kind: "empty-location-set", entity };

  const seen = new Set<LocationId>();
  for (const location of locations) {
    if (seen.has(location)) return { kind: "duplicate-location", location };
    seen.add(location);
    if (!topology.hasLocation(location)) return { kind: "unknown-location", location };
  }
  return undefined;
}

function validatePolicies(
  state: PlacementState,
  entity: TacticalEntityId,
  locations: readonly LocationId[],
  policies: readonly PlacementPolicy[],
): PlacementRejected | undefined {
  const context = { state, entity, locations };
  for (const policy of policies) {
    const rejection = policy(context);
    if (rejection) return rejection;
  }
  return undefined;
}

export function placeEntity(
  state: PlacementState,
  topology: Topology,
  entity: TacticalEntityId,
  locations: readonly LocationId[],
  policies: readonly PlacementPolicy[] = [],
): PlacementResult {
  if (locationsOf(state, entity) !== undefined) {
    return { kind: "rejected", reason: { kind: "entity-already-placed", entity } };
  }

  const invalid = validateLocations(topology, entity, locations);
  if (invalid) return { kind: "rejected", reason: invalid };

  const rejectedByPolicy = validatePolicies(state, entity, locations, policies);
  if (rejectedByPolicy) return { kind: "rejected", reason: rejectedByPolicy };

  return {
    kind: "placed",
    state: {
      placements: [...state.placements, { entity, locations: [...locations] }],
    },
  };
}

export function relocateEntity(
  state: PlacementState,
  topology: Topology,
  entity: TacticalEntityId,
  locations: readonly LocationId[],
  policies: readonly PlacementPolicy[] = [],
): PlacementResult {
  if (locationsOf(state, entity) === undefined) {
    return { kind: "rejected", reason: { kind: "entity-not-placed", entity } };
  }

  const invalid = validateLocations(topology, entity, locations);
  if (invalid) return { kind: "rejected", reason: invalid };

  const withoutEntity: PlacementState = {
    placements: state.placements.filter((placement) => placement.entity !== entity),
  };
  const rejectedByPolicy = validatePolicies(withoutEntity, entity, locations, policies);
  if (rejectedByPolicy) return { kind: "rejected", reason: rejectedByPolicy };

  return {
    kind: "relocated",
    state: {
      placements: state.placements.map((placement) =>
        placement.entity === entity ? { entity, locations: [...locations] } : placement,
      ),
    },
  };
}

export function removeEntity(
  state: PlacementState,
  entity: TacticalEntityId,
): PlacementResult {
  if (locationsOf(state, entity) === undefined) {
    return { kind: "rejected", reason: { kind: "entity-not-placed", entity } };
  }

  return {
    kind: "removed",
    state: {
      placements: state.placements.filter((placement) => placement.entity !== entity),
    },
  };
}
