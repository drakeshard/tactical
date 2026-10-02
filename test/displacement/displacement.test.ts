import { describe, expect, it } from "vitest";

import { locationId, tacticalEntityId } from "../../src/core/identity.js";
import { displaceEntity } from "../../src/displacement/displacement.js";
import {
  emptyPlacementState,
  exclusiveOccupancyPolicy,
  locationsOf,
  placeEntity,
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

describe("displacement", () => {
  it("reports deterministic structural before/after locations", () => {
    const entity = tacticalEntityId("entity");
    const placed = placeEntity(emptyPlacementState(), topology(), entity, [locationId("a")]);
    if (placed.kind !== "placed") throw new Error("fixture setup failed");

    const result = displaceEntity(placed.state, topology(), entity, [locationId("b")]);
    expect(result).toMatchObject({
      kind: "displaced",
      entity,
      from: [locationId("a")],
      to: [locationId("b")],
    });
    if (result.kind !== "displaced") return;
    expect(locationsOf(result.state, entity)).toEqual([locationId("b")]);
    expect(locationsOf(placed.state, entity)).toEqual([locationId("a")]);
  });

  it("preserves multi-location placement semantics", () => {
    const entity = tacticalEntityId("large");
    const placed = placeEntity(emptyPlacementState(), topology(), entity, [
      locationId("a"),
      locationId("b"),
    ]);
    if (placed.kind !== "placed") throw new Error("fixture setup failed");

    expect(
      displaceEntity(placed.state, topology(), entity, [locationId("b"), locationId("c")]),
    ).toMatchObject({
      kind: "displaced",
      from: [locationId("a"), locationId("b")],
      to: [locationId("b"), locationId("c")],
    });
  });

  it("respects explicit placement conflict policy", () => {
    const first = tacticalEntityId("first");
    const second = tacticalEntityId("second");
    const firstPlaced = placeEntity(emptyPlacementState(), topology(), first, [locationId("a")]);
    if (firstPlaced.kind !== "placed") throw new Error("fixture setup failed");
    const secondPlaced = placeEntity(firstPlaced.state, topology(), second, [locationId("b")]);
    if (secondPlaced.kind !== "placed") throw new Error("fixture setup failed");

    expect(
      displaceEntity(
        secondPlaced.state,
        topology(),
        second,
        [locationId("a")],
        [exclusiveOccupancyPolicy],
      ),
    ).toEqual({
      kind: "rejected",
      reason: {
        kind: "occupancy-conflict",
        location: locationId("a"),
        occupants: [first],
      },
    });
  });

  it("reports a missing entity explicitly", () => {
    const entity = tacticalEntityId("missing");
    expect(displaceEntity(emptyPlacementState(), topology(), entity, [locationId("a")])).toEqual({
      kind: "rejected",
      reason: { kind: "entity-not-placed", entity },
    });
  });

  it("contains no damage, status, reaction, or renderer consequence", () => {
    const entity = tacticalEntityId("entity");
    const placed = placeEntity(emptyPlacementState(), topology(), entity, [locationId("a")]);
    if (placed.kind !== "placed") throw new Error("fixture setup failed");

    const result = displaceEntity(placed.state, topology(), entity, [locationId("b")]);
    const encoded = JSON.stringify(result);
    expect(encoded).not.toContain("damage");
    expect(encoded).not.toContain("status");
    expect(encoded).not.toContain("reaction");
    expect(encoded).not.toContain("velocity");
  });
});
