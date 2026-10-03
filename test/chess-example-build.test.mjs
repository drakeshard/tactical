import { execFileSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("chess example build gate", () => {
  it("typechecks the complete browser sample", () => {
    const tsc = path.join(
      process.cwd(),
      "node_modules",
      "typescript",
      "bin",
      "tsc",
    );

    expect(() =>
      execFileSync(process.execPath, [
        tsc,
        "-p",
        "examples/chess/tsconfig.json",
        "--noEmit",
      ], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});
