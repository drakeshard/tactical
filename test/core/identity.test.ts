import { describe, expect, expectTypeOf, it } from "vitest";

import {
  deserializeLocationId,
  deserializeTacticalEntityId,
  locationId,
  locationIdsEqual,
  serializeLocationId,
  serializeTacticalEntityId,
  tacticalEntityId,
  tacticalEntityIdsEqual,
  type LocationId,
  type TacticalEntityId,
} from "../../src/core/identity.js";

describe("Tactical identity contracts", () => {
  it("keeps Tactical entity and location identities distinct at the type boundary", () => {
    const entity = tacticalEntityId("actor:alpha");
    const location = locationId("square:alpha");

    expectTypeOf(entity).toEqualTypeOf<TacticalEntityId>();
    expectTypeOf(location).toEqualTypeOf<LocationId>();
    expectTypeOf<TacticalEntityId>().not.toEqualTypeOf<LocationId>();
  });

  it("uses caller-provided opaque values without assigning RPG or coordinate semantics", () => {
    const entity = tacticalEntityId("external-subject-42");
    const location = locationId("battlefield-location-a");

    expect(serializeTacticalEntityId(entity)).toBe("external-subject-42");
    expect(serializeLocationId(location)).toBe("battlefield-location-a");
  });

  it("compares identities by their exact opaque representation", () => {
    expect(
      tacticalEntityIdsEqual(tacticalEntityId("entity-a"), tacticalEntityId("entity-a")),
    ).toBe(true);
    expect(
      tacticalEntityIdsEqual(tacticalEntityId("entity-a"), tacticalEntityId("entity-b")),
    ).toBe(false);
    expect(locationIdsEqual(locationId("location-a"), locationId("location-a"))).toBe(true);
    expect(locationIdsEqual(locationId("location-a"), locationId("location-b"))).toBe(false);
  });

  it("round-trips identities through JSON without semantic loss", () => {
    const encoded = JSON.stringify({
      entity: serializeTacticalEntityId(tacticalEntityId("entity:α")),
      location: serializeLocationId(locationId("zone/entry")),
    });
    const parsed = JSON.parse(encoded) as { entity: string; location: string };

    const entity = deserializeTacticalEntityId(parsed.entity);
    const location = deserializeLocationId(parsed.location);

    expect(serializeTacticalEntityId(entity)).toBe("entity:α");
    expect(serializeLocationId(location)).toBe("zone/entry");
  });

  it("does not invent validation policy for caller-owned identity strings", () => {
    const emptyEntity = tacticalEntityId("");
    const emptyLocation = locationId("");

    expect(serializeTacticalEntityId(emptyEntity)).toBe("");
    expect(serializeLocationId(emptyLocation)).toBe("");
  });

  it("is repeatable for identical explicit inputs", () => {
    const firstEntity = tacticalEntityId("entity-repeatable");
    const secondEntity = tacticalEntityId("entity-repeatable");
    const firstLocation = locationId("location-repeatable");
    const secondLocation = locationId("location-repeatable");

    expect(tacticalEntityIdsEqual(firstEntity, secondEntity)).toBe(true);
    expect(locationIdsEqual(firstLocation, secondLocation)).toBe(true);
    expect(serializeTacticalEntityId(firstEntity)).toBe(serializeTacticalEntityId(secondEntity));
    expect(serializeLocationId(firstLocation)).toBe(serializeLocationId(secondLocation));
  });
});
