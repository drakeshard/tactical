# Tactical Public API Readiness

Tactical's packaging mechanics are prepared for a future controlled public API admission, but the
admission gate remains closed.

## Ready mechanics

- package metadata identifies the repository, issue tracker, homepage, license, and future public
  registry access;
- consumer runtime compatibility is not artificially restricted to the repository's exact Node
  toolchain version;
- runtime dependencies remain zero;
- `sideEffects: false` records the current renderer-neutral module shape;
- `docs/review/public-api-candidates.json` records candidate subpaths and their source/build/type
  targets without activating package exports;
- `pnpm check:public-api-readiness` validates the candidate targets after build;
- `pnpm verify` executes the readiness gate.

## Deliberately closed

The following remain mandatory until controlled admission changes them:

- `private: true`;
- no `exports`, `main`, `module`, `types`, or `typings` package entry points;
- an intentionally empty `src/index.ts` stable gameplay export;
- `publishAuthorized: false` and `admissionGate: "closed"` in the candidate plan;
- no npm publication.

## Remaining evidence gate

Packaging mechanics are no longer the blocker. Stable public admission still requires real
production-consumer evidence that validates the exact contracts, package-name fit, compatibility
expectations, and candidate-by-candidate surface.

The chess sample is useful materially different consumer-shaped evidence, but it remains a
repository-local integration specimen and does not replace the real production-game gate.

When that gate is satisfied, admission should be a separate controlled change that chooses the
actual subset of candidate subpaths, updates the export map and stable entry points, changes the
package's private/public state, adds external-consumer pack/install verification, and only then
authorizes a genuine release.
