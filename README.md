# Drakeshard Tactical

Renderer-neutral deterministic discrete-battlefield Tactical domain mechanisms for Drakeshard games.

## Status

Tactical **v0.1 repository-local incubation is complete**. The extraction/public API review deferred every surviving gameplay candidate from stable admission because no real production-game consumer has validated the contracts yet.

The package identity remains `@drakeshard/tactical`, but the package is private and its stable/root gameplay export is intentionally empty. Implementation under `src/` remains incubation evidence and does not authorize npm publication.

See `docs/review/v0.1-extraction.md` for the candidate-by-candidate decision record.

## Scope

Tactical may own narrow reusable mechanisms for:

- Tactical and location identity;
- topology, with square topology as the first implementation;
- placement and occupancy;
- traversal;
- deterministic reachability and pathfinding;
- spatial queries;
- optional logical elevation, visibility/LoS, cover observations, and displacement;
- sequencing only if an admission spike proves independent Tactical ownership.

Tactical is **not** defined as grid + unit + turn.

## Non-ownership

Tactical does not own RPG progression/classes/stats/resources/equipment, combat formulas, abilities, cooldowns, statuses, AP/action economy, objectives, AI, encounter scripting, title-specific terrain effects, renderer transforms/physics, camera, input, or UI.

RPG and Tactical are sibling libraries. Consuming games compose their state.

## Engineering baseline

Run:

```sh
pnpm verify
```

This covers formatting/lint, architecture boundaries, package/admission invariants, strict source/test typechecking, tests, deterministic build, and build-shape validation.

See `docs/architecture/incubation-conventions.md` for the executable incubation contract.

## License

Apache-2.0 under the Drakeshard public shared-library default.
