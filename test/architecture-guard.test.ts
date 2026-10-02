import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findArchitectureViolations } from "../scripts/check-architecture.mjs";

const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function fixture(source) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tactical-architecture-"));
  roots.push(root);
  const src = path.join(root, "src");
  fs.mkdirSync(src, { recursive: true });
  fs.writeFileSync(path.join(src, "subject.ts"), source);
  return root;
}

describe("Tactical architecture guard", () => {
  it("allows renderer-neutral relative source", () => {
    const root = fixture('export const value = 1;\n');
    expect(findArchitectureViolations({ root })).toEqual([]);
  });

  it.each([
    ['import { x } from "@drakeshard/rpg";', "external package"],
    ['import { x } from "phaser";', "external package"],
    ['import { x } from "playcanvas";', "external package"],
    ['import { x } from "preact";', "external package"],
    ['const x = Math.random();', "Math.random"],
    ['const x = Date.now();', "Date.now"],
    ['const x = performance.now();', "performance.now"],
    ['setTimeout(() => {}, 1);', "setTimeout"],
    ['window.location.href;', "window"],
    ['document.body;', "document"],
  ])("rejects %s", (source, expected) => {
    const root = fixture(source);
    expect(findArchitectureViolations({ root }).join("\n")).toContain(expected);
  });
});
