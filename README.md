# Drakeshard Tactical

Renderer-neutral deterministic discrete-battlefield mechanisms for Drakeshard games.

## v0.1 selected public API

The pre-1.0 API selected for `@drakeshard/tactical@0.1.0` is:

- `@drakeshard/tactical/identity`
- `@drakeshard/tactical/topology`
- `@drakeshard/tactical/square`
- `@drakeshard/tactical/square-queries`
- `@drakeshard/tactical/placement`
- `@drakeshard/tactical/traversal`
- `@drakeshard/tactical/reachability`
- `@drakeshard/tactical/pathfinding`
- `@drakeshard/tactical/elevation`
- `@drakeshard/tactical/square-visibility`
- `@drakeshard/tactical/square-cover`
- `@drakeshard/tactical/displacement`

There is intentionally no root gameplay import from `@drakeshard/tactical` in v0.1. Consumers
choose only the battlefield mechanisms they need.

The package remains `private: true` until the separate npm release task. API selection and artifact
verification do not themselves authorize publication.

## Scope and boundaries

Tactical owns deterministic battlefield facts and transitions: opaque identities, topology,
placement/occupancy, traversal, movement search, elevation, logical square visibility, structural
cover observations, and structural displacement.

Tactical does not own RPG progression, combat formulas, abilities, AP/action economy, objectives,
AI, clocks, title-specific terrain effects, renderer/physics, input, or UI. RPG and Tactical remain
sibling libraries; the consuming application owns their composition.

Runtime dependencies remain zero.

## Evidence

The chess specimen at `examples/chess` provides a materially different discrete-board composition
test. Chess movement semantics, turns, capture, check/mate, castling, en passant, promotion, clocks,
and AI remain application-owned.

The package release-candidate gate also packs the exact artifact, installs it into a clean temporary
consumer, typechecks every selected subpath, imports every selected subpath at runtime by package
name, verifies the root import remains unsupported, and checks that source/tests/examples/scripts
do not leak into the installed package.

The machine-readable selection record is
`docs/review/public-api-candidates.json`.

## Local verification

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm verify
```

`pnpm verify` covers formatting/lint, architecture boundaries, selected-package invariants,
strict source/test typechecking, tests, build shape, selected public-API readiness, packed external
consumer verification, and representative performance pressure.

Run the chess sample locally with:

```sh
pnpm chess:preview
```

## License

Apache-2.0 under the Drakeshard public shared-library default.
