import { describe, expect, it } from "vitest";

import { tacticalEntityId } from "../../src/core/identity.js";
import { observeSquareCover } from "../../src/cover/square-cover.js";
import { displaceEntity } from "../../src/displacement/displacement.js";
import {
  elevationAt,
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
  squareLocationId,
  type SquareTopologyDefinition,
} from "../../src/square/topology.js";
import type { TraversalPolicy } from "../../src/traversal/traversal.js";
import { squareLineOfSight } from "../../src/visibility/square-los.js";

const definition: SquareTopologyDefinition = {
  bounds: { minX: 0, maxX: 5, minY: 0, maxY: 5 },
  adjacency: "eight",
};

function runScenario() {
  const topology = createSquareTopology(definition);
  if (!topology) throw new Error("fixture topology invalid");

  const scout = tacticalEntityId("game-actor:scout");
  const obstacle = tacticalEntityId("game-object:obstacle");

  const scoutPlaced = placeEntity(
    emptyPlacementState(),
    topology,
    scout,
    [squareLocationId({ x: 0, y: 0 })],
    [exclusiveOccupancyPolicy],
  );
  if (scoutPlaced.kind !== "placed") throw new Error("scout placement failed");

  const occupied = placeEntity(
    scoutPlaced.state,
    topology,
    obstacle,
    [squareLocationId({ x: 2, y: 2 })],
    [exclusiveOccupancyPolicy],
  );
  if (occupied.kind !== "placed") throw new Error("obstacle placement failed");

  let elevation = emptyElevationState();
  for (const [coord, level] of [
    [{ x: 0, y: 0 }, 0],
    [{ x: 1, y: 0 }, 0],
    [{ x: 2, y: 0 }, 1],
  ] as const) {
    const updated = setElevation(elevation, topology, squareLocationId(coord), level);
    if (updated.kind !== "updated") throw new Error("elevation setup failed");
    elevation = updated.state;
  }

  const traversal: TraversalPolicy = (_from, to) =>
    occupantsAt(occupied.state, to).length === 0 ? 1 : undefined;

  const reachable = reachableLocations(
    topology,
    squareLocationId({ x: 0, y: 0 }),
    3,
    traversal,
  );
  const path = lowestCostPath(
    topology,
    squareLocationId({ x: 0, y: 0 }),
    squareLocationId({ x: 4, y: 0 }),
    traversal,
  );
  const radius = squareLocationsWithinRadius(
    definition,
    { x: 2, y: 2 },
    2,
    "chebyshev",
  );
  const lineOfSight = squareLineOfSight(
    definition,
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    (location) => location === squareLocationId({ x: 2, y: 0 }),
  );
  const cover = observeSquareCover(
    definition,
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    () => false,
    (target, direction) =>
      target === squareLocationId({ x: 1, y: 0 }) && direction === "west",
  );
  const displacement = displaceEntity(
    occupied.state,
    topology,
    obstacle,
    [squareLocationId({ x: 3, y: 2 })],
    [exclusiveOccupancyPolicy],
  );

  return {
    neighborOrder: topology.neighbors(squareLocationId({ x: 0, y: 0 })),
    placement: occupied.state,
    elevation: elevationAt(elevation, squareLocationId({ x: 2, y: 0 })),
    reachable,
    path,
    distance: squareDistance({ x: 0, y: 0 }, { x: 4, y: 0 }, "manhattan"),
    radius,
    lineOfSight,
    cover,
    displacement,
  };
}

describe("cross-module Tactical pressure", () => {
  it("composes every surviving candidate in one headless scenario", () => {
    const result = runScenario();

    expect(result.reachable.kind).toBe("reachable");
    expect(result.path.kind).toBe("path");
    expect(result.radius.kind).toBe("locations");
    expect(result.lineOfSight).toMatchObject({
      kind: "observed",
      observation: { visible: false },
    });
    expect(result.cover).toMatchObject({
      kind: "observed",
      observation: { covered: true },
    });
    expect(result.displacement.kind).toBe("displaced");
    expect(result.elevation).toBe(1);
  });

  it("replays byte-identically from the same explicit inputs", () => {
    const first = runScenario();
    const second = runScenario();

    expect(second).toEqual(first);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it("contains structural facts rather than RPG/combat/presentation policy", () => {
    const encoded = JSON.stringify(runScenario());

    for (const forbidden of [
      "class",
      "job",
      "damage",
      "critical",
      "cooldown",
      "actionPoint",
      "renderer",
      "sprite",
      "camera",
      "velocity",
    ]) {
      expect(encoded).not.toContain(forbidden);
    }
  });
});
