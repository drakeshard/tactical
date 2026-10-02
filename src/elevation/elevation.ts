import type { LocationId } from "../core/identity.js";
import type { Topology } from "../space/topology.js";

export interface ElevationEntry {
  readonly location: LocationId;
  readonly level: number;
}

export interface ElevationState {
  readonly entries: readonly ElevationEntry[];
}

export type ElevationResult =
  | {
      readonly kind: "updated";
      readonly state: ElevationState;
    }
  | {
      readonly kind: "removed";
      readonly state: ElevationState;
    }
  | {
      readonly kind: "rejected";
      readonly reason:
        | { readonly kind: "unknown-location"; readonly location: LocationId }
        | { readonly kind: "invalid-level"; readonly level: number };
    };

export function emptyElevationState(): ElevationState {
  return { entries: [] };
}

export function elevationAt(state: ElevationState, location: LocationId): number | undefined {
  return state.entries.find((entry) => entry.location === location)?.level;
}

export function setElevation(
  state: ElevationState,
  topology: Topology,
  location: LocationId,
  level: number,
): ElevationResult {
  if (!topology.hasLocation(location)) {
    return { kind: "rejected", reason: { kind: "unknown-location", location } };
  }
  if (!Number.isSafeInteger(level)) {
    return { kind: "rejected", reason: { kind: "invalid-level", level } };
  }

  const existingIndex = state.entries.findIndex((entry) => entry.location === location);
  if (existingIndex === -1) {
    return {
      kind: "updated",
      state: { entries: [...state.entries, { location, level }] },
    };
  }

  return {
    kind: "updated",
    state: {
      entries: state.entries.map((entry, index) =>
        index === existingIndex ? { location, level } : entry,
      ),
    },
  };
}

export function removeElevation(state: ElevationState, location: LocationId): ElevationResult {
  return {
    kind: "removed",
    state: {
      entries: state.entries.filter((entry) => entry.location !== location),
    },
  };
}

export function elevationDifference(
  state: ElevationState,
  from: LocationId,
  to: LocationId,
): number | undefined {
  const fromLevel = elevationAt(state, from);
  const toLevel = elevationAt(state, to);
  if (fromLevel === undefined || toLevel === undefined) return undefined;
  return toLevel - fromLevel;
}
