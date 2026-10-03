import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("Tactical v0.1 extraction decision", () => {
  it("keeps publication private while exposing only the selected subpaths", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const rootSource = fs.readFileSync(path.join(root, "src", "index.ts"), "utf8");

    expect(packageJson.private).toBe(true);
    expect(packageJson.dependencies ?? {}).toEqual({});
    expect(packageJson.optionalDependencies ?? {}).toEqual({});
    expect(packageJson.peerDependencies ?? {}).toEqual({});
    expect(Object.keys(packageJson.exports ?? {})).toEqual([
      "./identity",
      "./topology",
      "./square",
      "./square-queries",
      "./placement",
      "./traversal",
      "./reachability",
      "./pathfinding",
      "./elevation",
      "./square-visibility",
      "./square-cover",
      "./displacement",
    ]);
    expect(packageJson.exports?.["."]).toBeUndefined();
    expect(packageJson.main).toBeUndefined();
    expect(packageJson.module).toBeUndefined();
    expect(packageJson.types).toBeUndefined();
    expect(packageJson.typings).toBeUndefined();
    expect(rootSource.replace(/\/\/.*$/gm, "").replace(/\s+/g, "")).toBe("export{};");
  });
});
