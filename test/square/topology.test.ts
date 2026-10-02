import { describe, expect, it } from "vitest";

import { locationId } from "../../src/core/identity.js";
import {
  createSquareTopology,
  isValidSquareDefinition,
  parseSquareLocationId,
  squareChebyshevDistance,
  squareContains,
  squareDirections,
  squareLocationId,
  squareManhattanDistance,
  squareNeighbor,
} from "../../src/square/topology.js";

describe("square topology", () => {
  it("encodes and parses square-specific locations without changing generic LocationId", () => {
    const id = squareLocationId({ x: -2, y: 7 });
    expect(id).toBe(locationId("square:-2,7"));
    expect(parseSquareLocationId(id)).toEqual({ x: -2, y: 7 });
    expect(parseSquareLocationId(locationId("zone:a"))).toBeUndefined();
  });

  it("uses deterministic direction order for four and eight adjacency", () => {
    expect(squareDirections("four")).toEqual(["north", "east", "south", "west"]);
    expect(squareDirections("eight")).toEqual([
      "north",
      "north-east",
      "east",
      "south-east",
      "south",
      "south-west",
      "west",
      "north-west",
    ]);
  });

  it("applies square direction deltas explicitly", () => {
    expect(squareNeighbor({ x: 4, y: 3 }, "north-west")).toEqual({ x: 3, y: 2 });
    expect(squareNeighbor({ x: 4, y: 3 }, "south-east")).toEqual({ x: 5, y: 4 });
  });

  it("enforces inclusive logical boundaries", () => {
    const bounds = { minX: 0, maxX: 2, minY: 0, maxY: 1 };
    expect(squareContains(bounds, { x: 0, y: 0 })).toBe(true);
    expect(squareContains(bounds, { x: 2, y: 1 })).toBe(true);
    expect(squareContains(bounds, { x: 3, y: 1 })).toBe(false);
  });

  it("rejects invalid square definitions", () => {
    expect(
      isValidSquareDefinition({
        bounds: { minX: 2, maxX: 1, minY: 0, maxY: 1 },
        adjacency: "four",
      }),
    ).toBe(false);
    expect(
      createSquareTopology({
        bounds: { minX: 2, maxX: 1, minY: 0, maxY: 1 },
        adjacency: "four",
      }),
    ).toBeUndefined();
  });

  it("enumerates bounded four-neighbors deterministically", () => {
    const topology = createSquareTopology({
      bounds: { minX: 0, maxX: 2, minY: 0, maxY: 2 },
      adjacency: "four",
    });
    expect(topology?.neighbors(squareLocationId({ x: 1, y: 1 }))).toEqual([
      squareLocationId({ x: 1, y: 0 }),
      squareLocationId({ x: 2, y: 1 }),
      squareLocationId({ x: 1, y: 2 }),
      squareLocationId({ x: 0, y: 1 }),
    ]);
  });

  it("enumerates bounded eight-neighbors with the same fixed directional order", () => {
    const topology = createSquareTopology({
      bounds: { minX: 0, maxX: 2, minY: 0, maxY: 2 },
      adjacency: "eight",
    });
    expect(topology?.neighbors(squareLocationId({ x: 0, y: 0 }))).toEqual([
      squareLocationId({ x: 1, y: 0 }),
      squareLocationId({ x: 1, y: 1 }),
      squareLocationId({ x: 0, y: 1 }),
    ]);
  });

  it("keeps square-specific distance helpers explicit", () => {
    expect(squareManhattanDistance({ x: 0, y: 0 }, { x: 3, y: 2 })).toBe(5);
    expect(squareChebyshevDistance({ x: 0, y: 0 }, { x: 3, y: 2 })).toBe(3);
  });
});
