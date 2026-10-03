import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findPackageInvariantViolations } from "../scripts/check-package.mjs";

const roots = [];
const exportsMap = {
  "./identity": {
    types: "./dist/core/identity.d.ts",
    import: "./dist/core/identity.js",
  },
  "./topology": {
    types: "./dist/space/topology.d.ts",
    import: "./dist/space/topology.js",
  },
  "./square": {
    types: "./dist/square/topology.d.ts",
    import: "./dist/square/topology.js",
  },
  "./square-queries": {
    types: "./dist/square/queries.d.ts",
    import: "./dist/square/queries.js",
  },
  "./placement": {
    types: "./dist/placement/placement.d.ts",
    import: "./dist/placement/placement.js",
  },
  "./traversal": {
    types: "./dist/traversal/traversal.d.ts",
    import: "./dist/traversal/traversal.js",
  },
  "./reachability": {
    types: "./dist/movement/reachability.d.ts",
    import: "./dist/movement/reachability.js",
  },
  "./pathfinding": {
    types: "./dist/movement/pathfinding.d.ts",
    import: "./dist/movement/pathfinding.js",
  },
  "./elevation": {
    types: "./dist/elevation/elevation.d.ts",
    import: "./dist/elevation/elevation.js",
  },
  "./square-visibility": {
    types: "./dist/visibility/square-los.d.ts",
    import: "./dist/visibility/square-los.js",
  },
  "./square-cover": {
    types: "./dist/cover/square-cover.d.ts",
    import: "./dist/cover/square-cover.js",
  },
  "./displacement": {
    types: "./dist/displacement/displacement.d.ts",
    import: "./dist/displacement/displacement.js",
  },
};

function fixture(overrides = {}, rootSource = "export {};\n") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tactical-package-"));
  roots.push(root);
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "@drakeshard/tactical",
      version: "0.1.0",
      private: true,
      type: "module",
      files: ["dist"],
      license: "Apache-2.0",
      exports: exportsMap,
      ...overrides,
    }),
  );
  fs.writeFileSync(path.join(root, "src", "index.ts"), rootSource);
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe("Tactical selected package invariant guard", () => {
  it("accepts the selected v0.1 surface while publication remains private", () => {
    expect(findPackageInvariantViolations({ root: fixture() })).toEqual([]);
  });

  it("rejects export drift and root entry points", () => {
    const root = fixture({
      exports: { ...exportsMap, ".": { import: "./dist/index.js" } },
      main: "./dist/index.js",
    });
    const result = findPackageInvariantViolations({ root }).join("\n");
    expect(result).toContain("selected v0.1");
    expect(result).toContain("root entry");
  });

  it("rejects runtime dependencies", () => {
    const root = fixture({ dependencies: { "@drakeshard/rpg": "0.1.0" } });
    expect(findPackageInvariantViolations({ root }).join("\n")).toContain("runtime dependency");
  });
});
