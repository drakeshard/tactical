import { describe, expect, it } from "vitest";

import { locationId } from "../../src/core/identity.js";
import { observeSquareCover } from "../../src/cover/square-cover.js";

const definition = {
  bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
  adjacency: "eight",
} as const;

describe("square cover observations", () => {
  it("reports structural cover from the target toward the observer", () => {
    expect(
      observeSquareCover(
        definition,
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        () => false,
        (target, direction) => target === locationId("square:2,2") && direction === "west",
      ),
    ).toMatchObject({
      kind: "observed",
      observation: {
        observer: locationId("square:1,2"),
        target: locationId("square:2,2"),
        directionFromTarget: "west",
        covered: true,
      },
    });
  });

  it("returns a cover fact without combat modifiers", () => {
    const result = observeSquareCover(
      definition,
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      () => false,
      () => false,
    );

    expect(result).toMatchObject({
      kind: "observed",
      observation: {
        directionFromTarget: "north-west",
        covered: false,
      },
    });
    expect(JSON.stringify(result)).not.toContain("modifier");
    expect(JSON.stringify(result)).not.toContain("damage");
  });

  it("does not report cover when logical line of sight is blocked", () => {
    expect(
      observeSquareCover(
        definition,
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        (location) => location === locationId("square:1,0"),
        () => true,
      ),
    ).toMatchObject({
      kind: "not-visible",
      lineOfSight: {
        visible: false,
        blockingLocation: locationId("square:1,0"),
      },
    });
  });

  it("does not invent directional cover for the same location", () => {
    expect(
      observeSquareCover(
        definition,
        { x: 2, y: 2 },
        { x: 2, y: 2 },
        () => false,
        () => true,
      ),
    ).toMatchObject({
      kind: "observed",
      observation: {
        directionFromTarget: "same",
        covered: false,
      },
    });
  });
});
