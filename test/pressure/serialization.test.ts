import { describe, expect, it } from "vitest";

import {
  deserializeLocationId,
  deserializeTacticalEntityId,
  locationId,
  serializeLocationId,
  serializeTacticalEntityId,
  tacticalEntityId,
} from "../../src/core/identity.js";
import {
  type ElevationState,
  elevationAt,
  emptyElevationState,
  setElevation,
} from "../../src/elevation/elevation.js";
import {
  emptyPlacementState,
  locationsOf,
  type PlacementState,
  placeEntity,
} from "../../src/placement/placement.js";
import {
  createSquareTopology,
  type SquareTopologyDefinition,
  squareLocationId,
} from "../../src/square/topology.js";

interface TacticalSnapshot {
  readonly placement: PlacementState;
  readonly elevation: ElevationState;
}

function roundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("Tactical serialization/persistence pressure", () => {
  it("round-trips opaque identities as plain caller-owned strings", () => {
    const entity = tacticalEntityId("actor:α");
    const location = locationId("logical:entry");

    expect(deserializeTacticalEntityId(roundTrip(serializeTacticalEntityId(entity)))).toBe(entity);
    expect(deserializeLocationId(roundTrip(serializeLocationId(location)))).toBe(location);
  });

  it("round-trips composed Tactical runtime state without a Tactical save envelope", () => {
    const definition: SquareTopologyDefinition = {
      bounds: { minX: 0, maxX: 2, minY: 0, maxY: 2 },
      adjacency: "eight",
    };
    const topology = createSquareTopology(definition);
    if (!topology) throw new Error("fixture topology invalid");

    const entity = tacticalEntityId("external:scout");
    const placed = placeEntity(emptyPlacementState(), topology, entity, [
      squareLocationId({ x: 1, y: 1 }),
    ]);
    if (placed.kind !== "placed") throw new Error("fixture placement failed");

    const raised = setElevation(
      emptyElevationState(),
      topology,
      squareLocationId({ x: 1, y: 1 }),
      3,
    );
    if (raised.kind !== "updated") throw new Error("fixture elevation failed");

    const snapshot: TacticalSnapshot = {
      placement: placed.state,
      elevation: raised.state,
    };
    const restored = roundTrip(snapshot);

    expect(restored).toEqual(snapshot);
    expect(locationsOf(restored.placement, entity)).toEqual([squareLocationId({ x: 1, y: 1 })]);
    expect(elevationAt(restored.elevation, squareLocationId({ x: 1, y: 1 }))).toBe(3);
    expect(JSON.stringify(restored)).not.toContain("saveVersion");
    expect(JSON.stringify(restored)).not.toContain("slot");
    expect(JSON.stringify(restored)).not.toContain("storage");
  });

  it("preserves ordering exactly through JSON round trips", () => {
    const state: PlacementState = {
      placements: [
        {
          entity: tacticalEntityId("first"),
          locations: [locationId("a"), locationId("b")],
        },
        {
          entity: tacticalEntityId("second"),
          locations: [locationId("c")],
        },
      ],
    };

    expect(roundTrip(state)).toEqual(state);
  });

  it("does not claim malformed external JSON is a validated Tactical state", () => {
    const malformed = JSON.parse(
      '{"placements":[{"entity":"external","locations":[]}]}',
    ) as unknown;

    expect(malformed).toEqual({
      placements: [{ entity: "external", locations: [] }],
    });
  });
});
