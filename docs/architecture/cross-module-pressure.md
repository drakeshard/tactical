# Cross-Module Tactical Pressure Test

TAC-I18 is the final repository-local composition pressure test before the v0.1 extraction/public-surface review.

## Surviving candidates exercised together

The headless scenario composes:

- Tactical identity;
- generic topology;
- square topology;
- placement and occupancy;
- traversal policy;
- reachability;
- lowest-cost pathfinding;
- elevation;
- spatial queries;
- logical visibility / LoS;
- cover observations;
- displacement.

Sequencing is excluded by the TAC-I13 ownership decision.

## Replay evidence

The complete scenario is executed twice from identical explicit definitions, state, and policies. Structural results are deeply equal and serialize byte-identically with `JSON.stringify`.

This supplements the module-focused determinism tests and TAC-I16 ordering review.

## Dependency audit

The repository architecture guard remains the executable inward-dependency audit. Authoritative `src/` rejects external runtime-package imports and renderer/RPG/UI/browser paths, hidden randomness, hidden wall clocks, implicit timers, and renderer/browser authoritative state.

The package guard independently requires:

- private package status;
- zero runtime dependencies;
- no package export map or stable entry metadata;
- intentionally empty stable/root gameplay export.

The composed pressure test therefore does not justify adding RPG, Foundation, renderer, UI, browser, physics, or other runtime dependencies.

## Boundary result

The current surviving modules form a coherent renderer-neutral discrete-battlefield toolkit, but this test is still repository-local incubation evidence. It does not demonstrate a real production consumer or by itself justify a stable package API.

## Admission status

No stable export is admitted by TAC-I18. TAC-I19 owns the candidate-by-candidate extraction decision.
