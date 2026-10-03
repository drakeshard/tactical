import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalizeEmptyRootSource(source) {
  return source
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, "")
    .trim();
}

function requireFile(root, relative, label, violations) {
  if (!fs.existsSync(path.join(root, relative))) {
    violations.push(`${label}: missing "${relative}"`);
  }
}

export function findPublicApiReadinessViolations({ root = process.cwd() } = {}) {
  const violations = [];
  const packageJson = readJson(path.join(root, "package.json"));
  const plan = readJson(path.join(root, "docs", "review", "public-api-candidates.json"));
  const rootIndex = path.join(root, "src", "index.ts");

  if (packageJson.private !== true) {
    violations.push("package.json: package must remain private until controlled admission");
  }
  if (packageJson.exports !== undefined) {
    violations.push("package.json: exports must remain absent while the admission gate is closed");
  }
  for (const field of ["main", "module", "types", "typings"]) {
    if (packageJson[field] !== undefined) {
      violations.push(`package.json: ${field} must remain absent while the admission gate is closed`);
    }
  }
  if (packageJson.engines !== undefined) {
    violations.push(
      "package.json: consumer runtime engines must not be inferred from the repository toolchain",
    );
  }
  if (packageJson.sideEffects !== false) {
    violations.push('package.json: "sideEffects" must be false for the renderer-neutral module set');
  }
  if (packageJson.publishConfig?.access !== "public") {
    violations.push('package.json: future package publication must declare publishConfig.access="public"');
  }
  if (packageJson.repository?.url !== "git+https://github.com/drakeshard/tactical.git") {
    violations.push("package.json: repository metadata must point at drakeshard/tactical");
  }
  if (packageJson.bugs?.url !== "https://github.com/drakeshard/tactical/issues") {
    violations.push("package.json: bugs metadata must point at the Tactical issue tracker");
  }
  if (packageJson.homepage !== "https://github.com/drakeshard/tactical#readme") {
    violations.push("package.json: homepage metadata must point at the Tactical repository");
  }

  if (!fs.existsSync(rootIndex)) {
    violations.push("src/index.ts: stable root entry point is missing");
  } else if (normalizeEmptyRootSource(fs.readFileSync(rootIndex, "utf8")) !== "export{};") {
    violations.push("src/index.ts: stable root gameplay export must remain empty");
  }

  if (plan.package !== "@drakeshard/tactical") {
    violations.push('public-api-candidates.json: package must be "@drakeshard/tactical"');
  }
  if (plan.status !== "candidate-only") {
    violations.push('public-api-candidates.json: status must remain "candidate-only"');
  }
  if (plan.admissionGate !== "closed") {
    violations.push('public-api-candidates.json: admissionGate must remain "closed"');
  }
  if (plan.publishAuthorized !== false) {
    violations.push("public-api-candidates.json: publishAuthorized must remain false");
  }
  if (!Array.isArray(plan.candidates) || plan.candidates.length === 0) {
    violations.push("public-api-candidates.json: at least one candidate is required");
    return violations;
  }

  const subpaths = new Set();
  for (const candidate of plan.candidates) {
    if (typeof candidate.subpath !== "string" || !candidate.subpath.startsWith("./")) {
      violations.push("public-api-candidates.json: every candidate needs a ./ subpath");
      continue;
    }
    if (subpaths.has(candidate.subpath)) {
      violations.push(`public-api-candidates.json: duplicate subpath "${candidate.subpath}"`);
    }
    subpaths.add(candidate.subpath);

    requireFile(root, candidate.source, candidate.subpath, violations);
    requireFile(root, candidate.dist, candidate.subpath, violations);
    requireFile(root, candidate.types, candidate.subpath, violations);
  }

  return violations;
}

function runCli() {
  const violations = findPublicApiReadinessViolations();
  if (violations.length > 0) {
    console.error("Public API readiness violations:");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    "Public API readiness: packaging mechanics ready; stable admission and publication remain closed.",
  );
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) runCli();
