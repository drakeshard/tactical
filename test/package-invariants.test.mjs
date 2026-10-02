import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findPackageInvariantViolations } from "../scripts/check-package.mjs";

const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

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
      ...overrides,
    }),
  );
  fs.writeFileSync(path.join(root, "src", "index.ts"), rootSource);
  return root;
}

describe("Tactical package invariant guard", () => {
  it("accepts the incubation package shape", () => {
    expect(findPackageInvariantViolations({ root: fixture() })).toEqual([]);
  });

  it("rejects stable export admission without review", () => {
    expect(
      findPackageInvariantViolations({
        root: fixture({ exports: { ".": "./dist/index.js" } }, 'export { thing } from "./thing";'),
      }).join("\n"),
    ).toContain("controlled public-surface admission");
  });

  it("rejects runtime dependencies", () => {
    expect(
      findPackageInvariantViolations({
        root: fixture({ dependencies: { "@drakeshard/rpg": "0.1.0" } }),
      }).join("\n"),
    ).toContain("runtime dependency");
  });
});
