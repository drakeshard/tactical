import { describe, expect, it } from "vitest";

import { locationId } from "../../src/core/identity.js";
import { lowestCostPath } from "../../src/movement/pathfinding.js";
import type { Topology } from "../../src/space/topology.js";
import type { TraversalPolicy } from "../../src/traversal/traversal.js";

function topology(): Topology {
  const edges = new Map([
    [locationId("start"), [locationId("north"), locationId("east")]],
    [locationId("north"), [locationId("goal")]],
    [locationId("east"), [locationId("goal"), locationId("detour")]],
    [locationId("detour"), [locationId("goal")]],
    [locationId("goal"), []],
    [locationId("isolated"), []],
  ]);

  return {
    hasLocation(location) {
      return edges.has(location);
    },
    neighbors(location) {
      return edges.get(location);
    },
  };
}

function policy(): TraversalPolicy {
  const costs = new Map([
    ["start->north", 1],
    ["start->east", 1],
    ["north->goal", 2],
    ["east->goal", 2],
    ["east->detour", 1],
    ["detour->goal", 5],
  ]);
  return (from, to) => costs.get(`${from}->${to}`);
}

describe("pathfinding", () => {
  it("returns the deterministic lowest-cost path and reconstruction", () => {
    expect(lowestCostPath(topology(), locationId("start"), locationId("goal"), policy())).toEqual({
      kind: "path",
      path: {
        locations: [locationId("start"), locationId("north"), locationId("goal")],
        cost: 3,
      },
    });
  });

  it("keeps the first traversal-ordered route for equal-cost alternatives", () => {
    const first = lowestCostPath(topology(), locationId("start"), locationId("goal"), policy());
    const second = lowestCostPath(topology(), locationId("start"), locationId("goal"), policy());

    expect(first).toEqual(second);
    expect(first).toEqual({
      kind: "path",
      path: {
        locations: [locationId("start"), locationId("north"), locationId("goal")],
        cost: 3,
      },
    });
  });

  it("returns a zero-cost single-location path when start equals goal", () => {
    expect(lowestCostPath(topology(), locationId("goal"), locationId("goal"), policy())).toEqual({
      kind: "path",
      path: { locations: [locationId("goal")], cost: 0 },
    });
  });

  it("reports unreachable goals without inventing fallback navigation", () => {
    expect(
      lowestCostPath(topology(), locationId("start"), locationId("isolated"), policy()),
    ).toEqual({
      kind: "unreachable",
      start: locationId("start"),
      goal: locationId("isolated"),
    });
  });

  it("reports unknown endpoints explicitly", () => {
    expect(lowestCostPath(topology(), locationId("missing"), locationId("goal"), policy())).toEqual(
      {
        kind: "unknown-location",
        location: locationId("missing"),
      },
    );
    expect(
      lowestCostPath(topology(), locationId("start"), locationId("missing"), policy()),
    ).toEqual({
      kind: "unknown-location",
      location: locationId("missing"),
    });
  });

  it("propagates invalid traversal costs explicitly", () => {
    expect(
      lowestCostPath(topology(), locationId("start"), locationId("goal"), () => Number.NaN),
    ).toEqual({
      kind: "invalid-transition-cost",
      from: locationId("start"),
      to: locationId("north"),
      cost: Number.NaN,
    });
  });
});
