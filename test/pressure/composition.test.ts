import { describe, expect, it } from "vitest";

import { tacticalEntityId } from "../../src/core/identity.js";
import { observeSquareCover } from "../../src/cover/square-cover.js";
import { displaceEntity } from "../../src/displacement/displacement.js";
import {
  elevationAt,
  elevationDifference,
  emptyElevationState,
  setElevation,
} from "../../src/elevation/elevation.js";
import { lowestCostPath } from "../../src/movement/pathfinding.js";
import { reachableLocations } from "../../src/movement/reachability.js";
import {
  emptyPlacementState,
  exclusiveOccupancyPolicy,
  occupantsAt,
  placeEntity,
} from "../../src/placement/placement.js";
import { squareDistance, squareLocationsWithinRadius } from "../../src/square/queries.js";
import {
  createSquareTopology,
  type SquareTopologyDefinition,
  squareLocationId,
} from "../../src/square/topology.js";
import type { TraversalPolicy } from "../../src/traversal/traversal.js";
import { squareLineOfSight } from "../../src/visibility/square-los.js";

interface ExternalActor {
  readonly actorId: string;
}

function tacticalIdFor(actor: ExternalActor) {
  return tacticalEntityId(`external:${actor.actorId}`);
}

const definition: SquareTopologyDefinition = {
  bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
  adjacency: "eight",
};

describe("headless Tactical composition pressure", () => {
  it("composes surviving modules without importing RPG, renderer, UI, or Foundation", () => {
    const topology = createSquareTopology(definition);
    if (!topology) throw new Error("fixture topology invalid");

    const scout = tacticalIdFor({ actorId: "scout" });
    const obstacle = tacticalIdFor({ actorId: "obstacle" });

    const scoutPlaced = placeEntity(
      emptyPlacementState(),
      topology,
      scout,
      [squareLocationId({ x: 0, y: 0 })],
      [exclusiveOccupancyPolicy],
    );
    if (scoutPlaced.kind !== "placed") throw new Error("scout fixture placement failed");

    const occupied = placeEntity(
      scoutPlaced.state,
      topology,
      obstacle,
      [squareLocationId({ x: 2, y: 1 })],
      [exclusiveOccupancyPolicy],
    );
    if (occupied.kind !== "placed") throw new Error("obstacle fixture placement failed");

    let elevation = emptyElevationState();
    for (const [coord, level] of [
      [{ x: 0, y: 0 }, 0],
      [{ x: 1, y: 0 }, 0],
      [{ x: 1, y: 1 }, 1],
      [{ x: 2, y: 0 }, 1],
      [{ x: 2, y: 1 }, 1],
      [{ x: 3, y: 0 }, 1],
    ] as const) {
      const result = setElevation(elevation, topology, squareLocationId(coord), level);
      if (result.kind !== "updated") throw new Error("elevation fixture setup failed");
      elevation = result.state;
    }

    const traversal: TraversalPolicy = (from, to) => {
      if (occupantsAt(occupied.state, to).length > 0) return undefined;
      const delta = elevationDifference(elevation, from, to);
      if (delta === undefined || Math.abs(delta) > 1) return undefined;
      return delta > 0 ? 2 : 1;
    };

    const reachable = reachableLocations(topology, squareLocationId({ x: 0, y: 0 }), 4, traversal);
    expect(reachable.kind).toBe("reachable");

    const path = lowestCostPath(
      topology,
      squareLocationId({ x: 0, y: 0 }),
      squareLocationId({ x: 3, y: 0 }),
      traversal,
    );
    expect(path).toEqual({
      kind: "path",
      path: {
        locations: [
          squareLocationId({ x: 0, y: 0 }),
          squareLocationId({ x: 1, y: 0 }),
          squareLocationId({ x: 2, y: 0 }),
          squareLocationId({ x: 3, y: 0 }),
        ],
        cost: 4,
      },
    });

    expect(squareDistance({ x: 0, y: 0 }, { x: 3, y: 0 }, "manhattan")).toBe(3);

    expect(squareLocationsWithinRadius(definition, { x: 1, y: 1 }, 1, "chebyshev")).toMatchObject({
      kind: "locations",
    });

    expect(
      squareLineOfSight(
        definition,
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        (location) => location === squareLocationId({ x: 2, y: 0 }),
      ),
    ).toMatchObject({
      kind: "observed",
      observation: {
        visible: false,
        blockingLocation: squareLocationId({ x: 2, y: 0 }),
      },
    });

    expect(
      observeSquareCover(
        definition,
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        () => false,
        (target, direction) => target === squareLocationId({ x: 1, y: 0 }) && direction === "west",
      ),
    ).toMatchObject({
      kind: "observed",
      observation: {
        covered: true,
        directionFromTarget: "west",
      },
    });

    const displaced = displaceEntity(
      occupied.state,
      topology,
      obstacle,
      [squareLocationId({ x: 3, y: 1 })],
      [exclusiveOccupancyPolicy],
    );
    expect(displaced).toMatchObject({
      kind: "displaced",
      entity: obstacle,
      from: [squareLocationId({ x: 2, y: 1 })],
      to: [squareLocationId({ x: 3, y: 1 })],
    });

    expect(elevationAt(elevation, squareLocationId({ x: 2, y: 0 }))).toBe(1);
  });

  it("repeats the same composed path result from identical explicit inputs", () => {
    const topology = createSquareTopology(definition);
    if (!topology) throw new Error("fixture topology invalid");

    const policy: TraversalPolicy = () => 1;
    const first = lowestCostPath(
      topology,
      squareLocationId({ x: 0, y: 0 }),
      squareLocationId({ x: 2, y: 1 }),
      policy,
    );
    const second = lowestCostPath(
      topology,
      squareLocationId({ x: 0, y: 0 }),
      squareLocationId({ x: 2, y: 1 }),
      policy,
    );

    expect(second).toEqual(first);
  });
});
