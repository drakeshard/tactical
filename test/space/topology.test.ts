import { describe, expect, it } from "vitest";

import { locationId } from "../../src/core/identity.js";
import {
  topologyHasLocation,
  topologyNeighbors,
  type Topology,
} from "../../src/space/topology.js";

function fixture(): Topology {
  const alpha = locationId("alpha");
  const beta = locationId("beta");
  const gamma = locationId("gamma");

  const neighbors = new Map([
    [alpha, [beta, gamma] as const],
    [beta, [gamma, alpha] as const],
    [gamma, [] as const],
  ]);

  return {
    hasLocation(location) {
      return neighbors.has(location);
    },
    neighbors(location) {
      return neighbors.get(location);
    },
  };
}

describe("minimal topology contract", () => {
  it("reports logical location membership without coordinate assumptions", () => {
    const topology = fixture();

    expect(topologyHasLocation(topology, locationId("alpha"))).toBe(true);
    expect(topologyHasLocation(topology, locationId("missing"))).toBe(false);
  });

  it("preserves implementation-defined deterministic neighbor order", () => {
    const topology = fixture();

    expect(topologyNeighbors(topology, locationId("alpha"))).toEqual({
      kind: "found",
      locations: [locationId("beta"), locationId("gamma")],
    });
    expect(topologyNeighbors(topology, locationId("beta"))).toEqual({
      kind: "found",
      locations: [locationId("gamma"), locationId("alpha")],
    });
  });

  it("distinguishes an existing location with no neighbors from an unknown location", () => {
    const topology = fixture();

    expect(topologyNeighbors(topology, locationId("gamma"))).toEqual({
      kind: "found",
      locations: [],
    });
    expect(topologyNeighbors(topology, locationId("missing"))).toEqual({
      kind: "unknown-location",
      location: locationId("missing"),
    });
  });

  it("is repeatable for identical topology state and explicit inputs", () => {
    const topology = fixture();

    expect(topologyNeighbors(topology, locationId("alpha"))).toEqual(
      topologyNeighbors(topology, locationId("alpha")),
    );
  });
});
