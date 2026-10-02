import { describe, expect, it } from "vitest";

import { locationId } from "../../src/core/identity.js";
import {
  squareLineOfSight,
  squareLineTrace,
} from "../../src/visibility/square-los.js";

const definition = {
  bounds: { minX: 0, maxX: 5, minY: 0, maxY: 5 },
  adjacency: "eight",
} as const;

describe("logical square line of sight", () => {
  it("traces deterministic center-to-center square geometry", () => {
    expect(squareLineTrace({ x: 0, y: 0 }, { x: 4, y: 2 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ]);
  });

  it("reports clear logical visibility with the full trace", () => {
    expect(squareLineOfSight(definition, { x: 0, y: 0 }, { x: 3, y: 0 }, () => false)).toEqual({
      kind: "observed",
      observation: {
        visible: true,
        trace: [
          locationId("square:0,0"),
          locationId("square:1,0"),
          locationId("square:2,0"),
          locationId("square:3,0"),
        ],
      },
    });
  });

  it("reports the first interior blocker without renderer raycasts", () => {
    const blocked = new Set([locationId("square:2,0"), locationId("square:3,0")]);

    expect(
      squareLineOfSight(definition, { x: 0, y: 0 }, { x: 4, y: 0 }, (location) =>
        blocked.has(location),
      ),
    ).toEqual({
      kind: "observed",
      observation: {
        visible: false,
        trace: [
          locationId("square:0,0"),
          locationId("square:1,0"),
          locationId("square:2,0"),
          locationId("square:3,0"),
          locationId("square:4,0"),
        ],
        blockingLocation: locationId("square:2,0"),
      },
    });
  });

  it("does not treat the target location itself as an interior blocker", () => {
    expect(
      squareLineOfSight(
        definition,
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        (location) => location === locationId("square:2,0"),
      ),
    ).toEqual({
      kind: "observed",
      observation: {
        visible: true,
        trace: [
          locationId("square:0,0"),
          locationId("square:1,0"),
          locationId("square:2,0"),
        ],
      },
    });
  });

  it("rejects out-of-bounds endpoints explicitly", () => {
    expect(squareLineOfSight(definition, { x: -1, y: 0 }, { x: 1, y: 0 }, () => false)).toEqual({
      kind: "outside-bounds",
      endpoint: "from",
      coord: { x: -1, y: 0 },
    });
    expect(squareLineOfSight(definition, { x: 0, y: 0 }, { x: 9, y: 0 }, () => false)).toEqual({
      kind: "outside-bounds",
      endpoint: "to",
      coord: { x: 9, y: 0 },
    });
  });
});
