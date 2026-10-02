import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findBuildShapeViolations } from "../scripts/check-build.mjs";

const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function fixture(distFiles) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tactical-build-"));
  roots.push(root);
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.mkdirSync(path.join(root, "dist"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "index.ts"), "export {};\n");
  for (const file of distFiles) fs.writeFileSync(path.join(root, "dist", file), "");
  return root;
}

describe("build-shape guard", () => {
  it("accepts exactly the generated TypeScript output", () => {
    const root = fixture(["index.js", "index.d.ts", "index.d.ts.map"]);
    expect(findBuildShapeViolations({ root })).toEqual([]);
  });

  it("rejects unexpected distributable files", () => {
    const root = fixture(["index.js", "index.d.ts", "index.d.ts.map", "internal.txt"]);
    expect(findBuildShapeViolations({ root }).join("\n")).toContain("unexpected distributable");
  });
});
