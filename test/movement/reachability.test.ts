import { describe, expect, it } from "vitest";

import { locationId } from "../../src/core/identity.js";
import { reachableLocations } from "../../src/movement/reachability.js";
import type { Topology } from "../../src/space/topology.js";
import type { TraversalPolicy } from "../../src/traversal/traversal.js";

function topology(): Topology {
  const edges = new Map([
    [locationId("start"), [locationId("north"), locationId("east")]],
    [locationId("north"), [locationId("goal")]],
    [locationId("east"), [locationId("goal"), locationId("far")]],
    [locationId("goal"), []],
    [locationId("far"), []],
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
    ["north->goal", 1],
    ["east->goal", 1],
    ["east->far", 3],
  ]);
  return (from, to) => costs.get(`${from}->${to}`);
}

describe("reachability", () => {
  it("returns deterministic locations within the explicit movement budget", () => {
    expect(reachableLocations(topology(), locationId("start"), 2, policy())).toEqual({
      kind: "reachable",
      locations: [
        { location: locationId("start"), cost: 0 },
        { location: locationId("north"), cost: 1 },
        { location: locationId("east"), cost: 1 },
        { location: locationId("goal"), cost: 2 },
      ],
    });
  });

  it("uses traversal order as the deterministic equal-cost tie order", () => {
    const first = reachableLocations(topology(), locationId("start"), 2, policy());
    const second = reachableLocations(topology(), locationId("start"), 2, policy());

    expect(first).toEqual(second);
    if (first.kind !== "reachable") return;
    expect(first.locations.map((entry) => entry.location)).toEqual([
      locationId("start"),
      locationId("north"),
      locationId("east"),
      locationId("goal"),
    ]);
  });

  it("does not treat budget as AP ownership", () => {
    expect(reachableLocations(topology(), locationId("start"), 0, policy())).toEqual({
      kind: "reachable",
      locations: [{ location: locationId("start"), cost: 0 }],
    });
  });

  it("rejects invalid budgets explicitly", () => {
    expect(reachableLocations(topology(), locationId("start"), -1, policy())).toEqual({
      kind: "invalid-budget",
      budget: -1,
    });
  });

  it("reports an unknown start location explicitly", () => {
    expect(reachableLocations(topology(), locationId("missing"), 2, policy())).toEqual({
      kind: "unknown-location",
      location: locationId("missing"),
    });
  });

  it("propagates invalid traversal costs explicitly", () => {
    expect(
      reachableLocations(topology(), locationId("start"), 2, () => Number.NaN),
    ).toEqual({
      kind: "invalid-transition-cost",
      from: locationId("start"),
      to: locationId("north"),
      cost: Number.NaN,
    });
  });
});
