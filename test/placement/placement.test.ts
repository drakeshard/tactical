import { describe, expect, it } from "vitest";

import { locationId, tacticalEntityId } from "../../src/core/identity.js";
import {
  emptyPlacementState,
  exclusiveOccupancyPolicy,
  locationsOf,
  occupantsAt,
  placeEntity,
  relocateEntity,
  removeEntity,
} from "../../src/placement/placement.js";
import type { Topology } from "../../src/space/topology.js";

function topology(): Topology {
  const locations = new Set([locationId("a"), locationId("b"), locationId("c")]);
  return {
    hasLocation(location) {
      return locations.has(location);
    },
    neighbors(location) {
      return locations.has(location) ? [] : undefined;
    },
  };
}

describe("placement and occupancy", () => {
  it("places an entity across one or more logical locations", () => {
    const entity = tacticalEntityId("large-entity");
    const result = placeEntity(emptyPlacementState(), topology(), entity, [
      locationId("a"),
      locationId("b"),
    ]);

    expect(result.kind).toBe("placed");
    if (result.kind !== "placed") return;
    expect(locationsOf(result.state, entity)).toEqual([locationId("a"), locationId("b")]);
    expect(occupantsAt(result.state, locationId("a"))).toEqual([entity]);
  });

  it("allows overlapping occupancy unless the caller supplies a policy", () => {
    const first = tacticalEntityId("first");
    const second = tacticalEntityId("second");
    const initial = placeEntity(emptyPlacementState(), topology(), first, [locationId("a")]);
    if (initial.kind !== "placed") throw new Error("fixture placement failed");

    const overlapping = placeEntity(initial.state, topology(), second, [locationId("a")]);
    expect(overlapping.kind).toBe("placed");
    if (overlapping.kind !== "placed") return;
    expect(occupantsAt(overlapping.state, locationId("a"))).toEqual([first, second]);
  });

  it("can enforce first-consumer exclusive occupancy as an explicit policy", () => {
    const first = tacticalEntityId("first");
    const second = tacticalEntityId("second");
    const initial = placeEntity(emptyPlacementState(), topology(), first, [locationId("a")]);
    if (initial.kind !== "placed") throw new Error("fixture placement failed");

    expect(
      placeEntity(initial.state, topology(), second, [locationId("a")], [exclusiveOccupancyPolicy]),
    ).toEqual({
      kind: "rejected",
      reason: {
        kind: "occupancy-conflict",
        location: locationId("a"),
        occupants: [first],
      },
    });
  });

  it("rejects invalid location sets explicitly", () => {
    const entity = tacticalEntityId("entity");
    expect(placeEntity(emptyPlacementState(), topology(), entity, [])).toEqual({
      kind: "rejected",
      reason: { kind: "empty-location-set", entity },
    });
    expect(
      placeEntity(emptyPlacementState(), topology(), entity, [locationId("a"), locationId("a")]),
    ).toEqual({
      kind: "rejected",
      reason: { kind: "duplicate-location", location: locationId("a") },
    });
    expect(placeEntity(emptyPlacementState(), topology(), entity, [locationId("missing")])).toEqual(
      {
        kind: "rejected",
        reason: { kind: "unknown-location", location: locationId("missing") },
      },
    );
  });

  it("relocates and removes without mutating the previous state", () => {
    const entity = tacticalEntityId("entity");
    const placed = placeEntity(emptyPlacementState(), topology(), entity, [locationId("a")]);
    if (placed.kind !== "placed") throw new Error("fixture placement failed");

    const relocated = relocateEntity(placed.state, topology(), entity, [locationId("b")]);
    expect(relocated.kind).toBe("relocated");
    if (relocated.kind !== "relocated") return;
    expect(locationsOf(placed.state, entity)).toEqual([locationId("a")]);
    expect(locationsOf(relocated.state, entity)).toEqual([locationId("b")]);

    const removed = removeEntity(relocated.state, entity);
    expect(removed.kind).toBe("removed");
    if (removed.kind !== "removed") return;
    expect(locationsOf(removed.state, entity)).toBeUndefined();
  });

  it("round-trips placement state through JSON", () => {
    const entity = tacticalEntityId("entity");
    const placed = placeEntity(emptyPlacementState(), topology(), entity, [
      locationId("a"),
      locationId("b"),
    ]);
    if (placed.kind !== "placed") throw new Error("fixture placement failed");

    expect(JSON.parse(JSON.stringify(placed.state))).toEqual(placed.state);
  });
});
