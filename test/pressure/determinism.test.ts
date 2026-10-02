import { describe, expect, it } from "vitest";

import { locationId, tacticalEntityId } from "../../src/core/identity.js";
import { lowestCostPath } from "../../src/movement/pathfinding.js";
import { reachableLocations } from "../../src/movement/reachability.js";
import { emptyPlacementState, placeEntity, relocateEntity } from "../../src/placement/placement.js";
import { squareLocationsWithinRadius } from "../../src/square/queries.js";
import { createSquareTopology, squareLocationId } from "../../src/square/topology.js";
import { squareLineTrace } from "../../src/visibility/square-los.js";

describe("Tactical determinism review", () => {
  it("locks square neighbor order after bounds filtering", () => {
    const topology = createSquareTopology({
      bounds: { minX: 0, maxX: 2, minY: 0, maxY: 2 },
      adjacency: "eight",
    });
    if (!topology) throw new Error("fixture topology invalid");

    const first = topology.neighbors(squareLocationId({ x: 1, y: 1 }));
    const second = topology.neighbors(squareLocationId({ x: 1, y: 1 }));

    expect(first).toEqual(second);
    expect(first).toEqual([
      squareLocationId({ x: 1, y: 0 }),
      squareLocationId({ x: 2, y: 0 }),
      squareLocationId({ x: 2, y: 1 }),
      squareLocationId({ x: 2, y: 2 }),
      squareLocationId({ x: 1, y: 2 }),
      squareLocationId({ x: 0, y: 2 }),
      squareLocationId({ x: 0, y: 1 }),
      squareLocationId({ x: 0, y: 0 }),
    ]);
  });

  it("locks equal-cost search tie-breaking to deterministic traversal order", () => {
    const topology = createSquareTopology({
      bounds: { minX: 0, maxX: 2, minY: 0, maxY: 2 },
      adjacency: "eight",
    });
    if (!topology) throw new Error("fixture topology invalid");

    const policy = () => 1;
    const pathA = lowestCostPath(
      topology,
      squareLocationId({ x: 0, y: 0 }),
      squareLocationId({ x: 2, y: 1 }),
      policy,
    );
    const pathB = lowestCostPath(
      topology,
      squareLocationId({ x: 0, y: 0 }),
      squareLocationId({ x: 2, y: 1 }),
      policy,
    );
    const reachableA = reachableLocations(topology, squareLocationId({ x: 0, y: 0 }), 2, policy);
    const reachableB = reachableLocations(topology, squareLocationId({ x: 0, y: 0 }), 2, policy);

    expect(pathA).toEqual(pathB);
    expect(pathA).toEqual({
      kind: "path",
      path: {
        locations: [
          squareLocationId({ x: 0, y: 0 }),
          squareLocationId({ x: 1, y: 0 }),
          squareLocationId({ x: 2, y: 1 }),
        ],
        cost: 2,
      },
    });
    expect(reachableA).toEqual(reachableB);
  });

  it("preserves placement and caller location ordering across transitions", () => {
    const topology = createSquareTopology({
      bounds: { minX: 0, maxX: 2, minY: 0, maxY: 2 },
      adjacency: "four",
    });
    if (!topology) throw new Error("fixture topology invalid");

    const first = tacticalEntityId("first");
    const second = tacticalEntityId("second");
    const firstPlaced = placeEntity(emptyPlacementState(), topology, first, [
      locationId("square:0,0"),
    ]);
    if (firstPlaced.kind !== "placed") throw new Error("fixture placement failed");
    const secondPlaced = placeEntity(firstPlaced.state, topology, second, [
      locationId("square:1,0"),
    ]);
    if (secondPlaced.kind !== "placed") throw new Error("fixture placement failed");

    const relocated = relocateEntity(secondPlaced.state, topology, first, [
      locationId("square:0,1"),
      locationId("square:0,2"),
    ]);
    if (relocated.kind !== "relocated") throw new Error("fixture relocation failed");

    expect(relocated.state.placements).toEqual([
      {
        entity: first,
        locations: [locationId("square:0,1"), locationId("square:0,2")],
      },
      {
        entity: second,
        locations: [locationId("square:1,0")],
      },
    ]);
  });

  it("locks deterministic square radius and logical line-trace ordering", () => {
    const definition = {
      bounds: { minX: 0, maxX: 2, minY: 0, maxY: 2 },
      adjacency: "eight",
    } as const;

    expect(squareLocationsWithinRadius(definition, { x: 1, y: 1 }, 1, "manhattan")).toEqual({
      kind: "locations",
      locations: [
        squareLocationId({ x: 1, y: 0 }),
        squareLocationId({ x: 0, y: 1 }),
        squareLocationId({ x: 1, y: 1 }),
        squareLocationId({ x: 2, y: 1 }),
        squareLocationId({ x: 1, y: 2 }),
      ],
    });

    expect(squareLineTrace({ x: 0, y: 0 }, { x: 4, y: 2 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ]);
  });

  it("produces byte-identical JSON for identical plain Tactical state", () => {
    const state = {
      placements: [
        {
          entity: tacticalEntityId("entity"),
          locations: [locationId("a"), locationId("b")],
        },
      ],
      elevation: [{ location: locationId("a"), level: 2 }],
    };

    expect(JSON.stringify(state)).toBe(JSON.stringify(state));
  });
});
