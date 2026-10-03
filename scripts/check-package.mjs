import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const runtimeDependencyFields = ["dependencies", "optionalDependencies", "peerDependencies"];
const expectedExports = {
  "./identity": { types: "./dist/core/identity.d.ts", import: "./dist/core/identity.js" },
  "./topology": { types: "./dist/space/topology.d.ts", import: "./dist/space/topology.js" },
  "./square": { types: "./dist/square/topology.d.ts", import: "./dist/square/topology.js" },
  "./square-queries": { types: "./dist/square/queries.d.ts", import: "./dist/square/queries.js" },
  "./placement": { types: "./dist/placement/placement.d.ts", import: "./dist/placement/placement.js" },
  "./traversal": { types: "./dist/traversal/traversal.d.ts", import: "./dist/traversal/traversal.js" },
  "./reachability": { types: "./dist/movement/reachability.d.ts", import: "./dist/movement/reachability.js" },
  "./pathfinding": { types: "./dist/movement/pathfinding.d.ts", import: "./dist/movement/pathfinding.js" },
  "./elevation": { types: "./dist/elevation/elevation.d.ts", import: "./dist/elevation/elevation.js" },
  "./square-visibility": { types: "./dist/visibility/square-los.d.ts", import: "./dist/visibility/square-los.js" },
  "./square-cover": { types: "./dist/cover/square-cover.d.ts", import: "./dist/cover/square-cover.js" },
  "./displacement": { types: "./dist/displacement/displacement.d.ts", import: "./dist/displacement/displacement.js" },
};

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function hasEntries(value) { return value && typeof value === "object" && Object.keys(value).length > 0; }
function normalizeEmptyRootSource(source) {
  return source.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, "").trim();
}

export function findPackageInvariantViolations({ root = process.cwd() } = {}) {
  const violations = [];
  const packageJson = readJson(path.join(root, "package.json"));
  const rootIndexPath = path.join(root, "src", "index.ts");

  if (packageJson.name !== "@drakeshard/tactical") violations.push('package.json: name must remain "@drakeshard/tactical"');
  if (packageJson.private !== true) violations.push("package.json: package must remain private until the npm release task");
  if (packageJson.type !== "module") violations.push('package.json: "type" must remain "module"');
  if (packageJson.license !== "Apache-2.0") violations.push('package.json: "license" must be "Apache-2.0"');
  if (!Array.isArray(packageJson.files) || packageJson.files.length !== 1 || packageJson.files[0] !== "dist") {
    violations.push('package.json: "files" must remain exactly ["dist"]');
  }
  if (JSON.stringify(packageJson.exports) !== JSON.stringify(expectedExports)) {
    violations.push("package.json: exports must exactly match the selected v0.1 Tactical subpaths");
  }
  for (const field of ["main", "module", "types", "typings"]) {
    if (packageJson[field] !== undefined) violations.push(`package.json: root entry field "${field}" must remain absent for v0.1`);
  }
  for (const field of runtimeDependencyFields) {
    if (hasEntries(packageJson[field])) {
      violations.push(`package.json: runtime dependency field "${field}" must remain empty (found: ${Object.keys(packageJson[field]).sort().join(", ")})`);
    }
  }
  if (!fs.existsSync(rootIndexPath)) violations.push("src/index.ts: stable root entry point is missing");
  else if (normalizeEmptyRootSource(fs.readFileSync(rootIndexPath, "utf8")) !== "export{};") {
    violations.push("src/index.ts: root gameplay export must remain empty for v0.1");
  }
  return violations;
}

function runCli() {
  const violations = findPackageInvariantViolations();
  if (violations.length > 0) {
    console.error("Package/public-surface invariant violations:");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exitCode = 1;
    return;
  }
  console.log("Package/public-surface invariants: OK");
}
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) runCli();
