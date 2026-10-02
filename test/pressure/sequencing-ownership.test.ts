import { describe, expect, it } from "vitest";

import { locationId, tacticalEntityId, type TacticalEntityId } from "../../src/core/identity.js";
import { emptyPlacementState, placeEntity } from "../../src/placement/placement.js";
import type { Topology } from "../../src/space/topology.js";

interface ExternalTurnPolicy {
  readonly order: readonly TacticalEntityId[];
  readonly currentIndex: number;
}

function nextExternalOpportunity(policy: ExternalTurnPolicy): ExternalTurnPolicy {
  if (policy.order.length === 0) return policy;
  return {
    order: policy.order,
    currentIndex: (policy.currentIndex + 1) % policy.order.length,
  };
}

function topology(): Topology {
  const known = new Set([locationId("left"), locationId("right")]);
  return {
    hasLocation(location) {
      return known.has(location);
    },
    neighbors(location) {
      if (!known.has(location)) return undefined;
      return location === locationId("left") ? [locationId("right")] : [locationId("left")];
    },
  };
}

describe("sequencing ownership pressure", () => {
  it("allows different external opportunity orders over identical Tactical state", () => {
    const alpha = tacticalEntityId("alpha");
    const beta = tacticalEntityId("beta");

    const alphaPlaced = placeEntity(emptyPlacementState(), topology(), alpha, [locationId("left")]);
    if (alphaPlaced.kind !== "placed") throw new Error("fixture setup failed");
    const bothPlaced = placeEntity(alphaPlaced.state, topology(), beta, [locationId("right")]);
    if (bothPlaced.kind !== "placed") throw new Error("fixture setup failed");

    const roundRobin: ExternalTurnPolicy = { order: [alpha, beta], currentIndex: 0 };
    const priorityFirst: ExternalTurnPolicy = { order: [beta, alpha], currentIndex: 0 };

    expect(roundRobin.order[roundRobin.currentIndex]).toBe(alpha);
    expect(priorityFirst.order[priorityFirst.currentIndex]).toBe(beta);
    expect(bothPlaced.state).toEqual(bothPlaced.state);
  });

  it("keeps opportunity advancement independent from Tactical spatial state", () => {
    const alpha = tacticalEntityId("alpha");
    const beta = tacticalEntityId("beta");
    const before: ExternalTurnPolicy = { order: [alpha, beta], currentIndex: 0 };
    const after = nextExternalOpportunity(before);

    expect(after.order[after.currentIndex]).toBe(beta);
    expect(before).toEqual({ order: [alpha, beta], currentIndex: 0 });
  });

  it("can serialize game-owned sequencing without adding Tactical sequencing state", () => {
    const alpha = tacticalEntityId("alpha");
    const beta = tacticalEntityId("beta");
    const policy: ExternalTurnPolicy = { order: [alpha, beta], currentIndex: 1 };

    expect(JSON.parse(JSON.stringify(policy))).toEqual({
      order: ["alpha", "beta"],
      currentIndex: 1,
    });
  });
});
