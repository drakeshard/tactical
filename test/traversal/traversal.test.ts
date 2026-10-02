import { describe, expect, it } from "vitest";

import { locationId } from "../../src/core/identity.js";
import type { Topology } from "../../src/space/topology.js";
import { type TraversalPolicy, traversalTransitions } from "../../src/traversal/traversal.js";

function topology(): Topology {
  const relationships = new Map([
    [locationId("ground"), [locationId("ramp"), locationId("blocked"), locationId("gap")]],
    [locationId("ramp"), [locationId("ground"), locationId("ledge")]],
    [locationId("ledge"), [locationId("ramp"), locationId("drop")]],
    [locationId("gap"), [locationId("landing")]],
    [locationId("landing"), []],
    [locationId("drop"), []],
    [locationId("blocked"), []],
  ]);

  return {
    hasLocation(location) {
      return relationships.has(location);
    },
    neighbors(location) {
      return relationships.get(location);
    },
  };
}

function firstConsumerPolicy(): TraversalPolicy {
  const costs = new Map([
    ["ground->ramp", 1],
    ["ground->gap", 2],
    ["ramp->ground", 1],
    ["ramp->ledge", 2],
    ["ledge->ramp", 1],
    ["ledge->drop", 1],
    ["gap->landing", 2],
  ]);

  return (from, to) => costs.get(`${from}->${to}`);
}

describe("traversal", () => {
  it("keeps topology adjacency separate from caller movement policy", () => {
    expect(traversalTransitions(topology(), locationId("ground"), firstConsumerPolicy())).toEqual({
      kind: "transitions",
      transitions: [
        { from: locationId("ground"), to: locationId("ramp"), cost: 1 },
        { from: locationId("ground"), to: locationId("gap"), cost: 2 },
      ],
    });
  });

  it("supports normal, ramp, climb, jump/gap, drop, and one-way pressure cases", () => {
    const policy = firstConsumerPolicy();

    expect(traversalTransitions(topology(), locationId("ramp"), policy)).toEqual({
      kind: "transitions",
      transitions: [
        { from: locationId("ramp"), to: locationId("ground"), cost: 1 },
        { from: locationId("ramp"), to: locationId("ledge"), cost: 2 },
      ],
    });
    expect(traversalTransitions(topology(), locationId("gap"), policy)).toEqual({
      kind: "transitions",
      transitions: [{ from: locationId("gap"), to: locationId("landing"), cost: 2 }],
    });
    expect(traversalTransitions(topology(), locationId("ledge"), policy)).toEqual({
      kind: "transitions",
      transitions: [
        { from: locationId("ledge"), to: locationId("ramp"), cost: 1 },
        { from: locationId("ledge"), to: locationId("drop"), cost: 1 },
      ],
    });
    expect(traversalTransitions(topology(), locationId("drop"), policy)).toEqual({
      kind: "transitions",
      transitions: [],
    });
  });

  it("preserves topology order after blocked transitions are filtered", () => {
    const result = traversalTransitions(topology(), locationId("ground"), firstConsumerPolicy());
    expect(result).toEqual({
      kind: "transitions",
      transitions: [
        { from: locationId("ground"), to: locationId("ramp"), cost: 1 },
        { from: locationId("ground"), to: locationId("gap"), cost: 2 },
      ],
    });
  });

  it("rejects invalid policy costs explicitly", () => {
    expect(traversalTransitions(topology(), locationId("ground"), () => Number.NaN)).toEqual({
      kind: "invalid-cost",
      from: locationId("ground"),
      to: locationId("ramp"),
      cost: Number.NaN,
    });
  });

  it("reports unknown starting locations explicitly", () => {
    expect(traversalTransitions(topology(), locationId("missing"), firstConsumerPolicy())).toEqual({
      kind: "unknown-location",
      location: locationId("missing"),
    });
  });
});
