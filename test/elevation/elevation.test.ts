import { describe, expect, it } from "vitest";

import { locationId } from "../../src/core/identity.js";
import {
  elevationAt,
  elevationDifference,
  emptyElevationState,
  removeElevation,
  setElevation,
} from "../../src/elevation/elevation.js";
import type { Topology } from "../../src/space/topology.js";

function topology(): Topology {
  const locations = new Set([locationId("low"), locationId("high")]);
  return {
    hasLocation(location) {
      return locations.has(location);
    },
    neighbors(location) {
      return locations.has(location) ? [] : undefined;
    },
  };
}

describe("elevation", () => {
  it("stores optional discrete logical elevation by LocationId", () => {
    const result = setElevation(emptyElevationState(), topology(), locationId("low"), -2);

    expect(result.kind).toBe("updated");
    if (result.kind !== "updated") return;
    expect(elevationAt(result.state, locationId("low"))).toBe(-2);
    expect(elevationAt(result.state, locationId("high"))).toBeUndefined();
  });

  it("updates without changing entry order", () => {
    const low = setElevation(emptyElevationState(), topology(), locationId("low"), 0);
    if (low.kind !== "updated") throw new Error("fixture setup failed");
    const high = setElevation(low.state, topology(), locationId("high"), 3);
    if (high.kind !== "updated") throw new Error("fixture setup failed");
    const changed = setElevation(high.state, topology(), locationId("low"), 1);

    expect(changed).toEqual({
      kind: "updated",
      state: {
        entries: [
          { location: locationId("low"), level: 1 },
          { location: locationId("high"), level: 3 },
        ],
      },
    });
  });

  it("rejects unknown locations and non-discrete levels", () => {
    expect(setElevation(emptyElevationState(), topology(), locationId("missing"), 1)).toEqual({
      kind: "rejected",
      reason: { kind: "unknown-location", location: locationId("missing") },
    });
    expect(setElevation(emptyElevationState(), topology(), locationId("low"), 1.5)).toEqual({
      kind: "rejected",
      reason: { kind: "invalid-level", level: 1.5 },
    });
  });

  it("reports structural elevation difference without interpreting consequences", () => {
    const low = setElevation(emptyElevationState(), topology(), locationId("low"), 2);
    if (low.kind !== "updated") throw new Error("fixture setup failed");
    const high = setElevation(low.state, topology(), locationId("high"), 5);
    if (high.kind !== "updated") throw new Error("fixture setup failed");

    expect(elevationDifference(high.state, locationId("low"), locationId("high"))).toBe(3);
    expect(elevationDifference(high.state, locationId("high"), locationId("low"))).toBe(-3);
  });

  it("removes elevation without implying a default world height", () => {
    const set = setElevation(emptyElevationState(), topology(), locationId("low"), 2);
    if (set.kind !== "updated") throw new Error("fixture setup failed");

    const removed = removeElevation(set.state, locationId("low"));
    expect(removed.kind).toBe("removed");
    if (removed.kind !== "removed") return;
    expect(elevationAt(removed.state, locationId("low"))).toBeUndefined();
  });

  it("round-trips plain elevation state through JSON", () => {
    const set = setElevation(emptyElevationState(), topology(), locationId("low"), 2);
    if (set.kind !== "updated") throw new Error("fixture setup failed");

    expect(JSON.parse(JSON.stringify(set.state))).toEqual(set.state);
  });
});
