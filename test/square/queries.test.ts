import { describe, expect, it } from "vitest";

import {
  squareDistance,
  squareLocationsWithinRadius,
  squareRelativeDirection,
} from "../../src/square/queries.js";
import { squareLocationId } from "../../src/square/topology.js";

const definition = {
  bounds: { minX: 0, maxX: 2, minY: 0, maxY: 2 },
  adjacency: "eight",
} as const;

describe("square spatial queries", () => {
  it("keeps distance metrics explicit and square-specific", () => {
    expect(squareDistance({ x: 0, y: 0 }, { x: 2, y: 1 }, "manhattan")).toBe(3);
    expect(squareDistance({ x: 0, y: 0 }, { x: 2, y: 1 }, "chebyshev")).toBe(2);
  });

  it("reports relative direction without introducing targeting semantics", () => {
    expect(squareRelativeDirection({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe("same");
    expect(squareRelativeDirection({ x: 1, y: 1 }, { x: 2, y: 0 })).toBe("north-east");
    expect(squareRelativeDirection({ x: 1, y: 1 }, { x: 0, y: 2 })).toBe("south-west");
  });

  it("returns Manhattan radius locations in deterministic row-major order", () => {
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
  });

  it("supports Chebyshev neighborhoods without changing generic topology", () => {
    expect(squareLocationsWithinRadius(definition, { x: 0, y: 0 }, 1, "chebyshev")).toEqual({
      kind: "locations",
      locations: [
        squareLocationId({ x: 0, y: 0 }),
        squareLocationId({ x: 1, y: 0 }),
        squareLocationId({ x: 0, y: 1 }),
        squareLocationId({ x: 1, y: 1 }),
      ],
    });
  });

  it("rejects invalid radius and out-of-bounds centers explicitly", () => {
    expect(squareLocationsWithinRadius(definition, { x: 1, y: 1 }, -1, "manhattan")).toEqual({
      kind: "invalid-radius",
      radius: -1,
    });
    expect(squareLocationsWithinRadius(definition, { x: 9, y: 9 }, 1, "manhattan")).toEqual({
      kind: "outside-bounds",
      center: { x: 9, y: 9 },
    });
  });
});
