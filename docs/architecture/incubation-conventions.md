# Tactical Implementation and Incubation Conventions

## Status and authority

These repository-level conventions are established by TAC-I00. They operationalize TAC-ARCH-001 and TAC-PLAN-001 without replacing controlled Drive architecture.

No Tactical gameplay module or stable public API is admitted by this document.

## Identity and genericity

- `TacticalEntityId` must not imply RPG character/unit semantics.
- `LocationId` must not imply coordinates.
- Do not create a universal actor/entity abstraction.
- Topology is the generic spatial abstraction; square topology is the first implementation.
- Do not implement hex/zone/continuous topologies merely to prove genericity.
- Avoid generic graph frameworks, arbitrary metadata bags, or universal targeting semantics.

## Definitions and runtime state

- Keep authored definitions/policy inputs separate from runtime state where applicable.
- Runtime state should contain only module-owned data required for authoritative behavior.
- Persistable state should be plain data and JSON-compatible where practical.
- Do not store renderer objects, DOM objects, service instances, functions, hidden registries, or title-owned object graphs.

## Operations and outcomes

Each module defines the operation/result shapes natural to its responsibility. Do not introduce a package-wide result type, command bus, event bus, service locator, or universal metadata envelope.

Authoritative behavior should conceptually be:

```text
current Tactical state + explicit operation + explicit topology/policy inputs
  -> explicit module-local outcome + next state/facts
```

## Determinism

Authoritative Tactical behavior must be repeatable from identical state, ordered inputs, topology/policy values, and other explicit external inputs.

Do not use:

- `Math.random()`, random UUID generation, or implicit randomness;
- `Date.now()`, zero-argument `new Date()`, or `performance.now()`;
- implicit timers or scheduling to mutate authoritative state;
- renderer/physics state, DOM/browser state, or frame timing;
- unspecified iteration/search tie-breaking.

If time, randomness, or a title policy is genuinely required, the caller supplies it explicitly. This does not imply a Foundation dependency.

## Dependency boundary

Tactical starts with zero runtime dependencies.

- No `@drakeshard/rpg` dependency.
- No `@drakeshard/foundation` dependency without separate Foundation admission evidence.
- No Phaser, PlayCanvas, Preact/UI, browser, physics, or external pathfinding dependency in authoritative source.
- External runtime packages are rejected by default until separately admitted.
- Dev/test/build tooling is permitted outside authoritative source.

The consuming game normally composes Foundation services and RPG state around Tactical.

## Domain ownership boundary

Tactical may own structural battlefield facts and transitions. Games retain RPG progression/classes/stats/resources/equipment, damage/healing/hit/crit/armor formulas, abilities, cooldowns, statuses, reactions, AP/action economy, objectives, victory/defeat, AI, encounter scripting, title-specific terrain effects, renderer/world transforms, renderer physics, camera/input/UI.

## Public-surface admission

Until a controlled extraction/public-surface review changes the rule:

- `private: true` remains set;
- runtime dependency fields remain empty;
- package `exports`, `main`, `module`, `types`, and `typings` remain absent;
- `src/index.ts` remains an empty stable gameplay export;
- package files remain limited to intended `dist/` build output.

Incubation code existing under `src/` is not stable API admission.

## Testing convention

Each admitted incubation mechanism should cover the applicable subset of:

1. contract/invariant behavior;
2. invalid/rejected inputs;
3. deterministic repeatability;
4. explicit ordering/tie-breaking;
5. JSON round-trip compatibility for persisted state;
6. preservation of caller-owned definitions/policy;
7. title-neutral fixtures;
8. current-consumer pressure fixtures after the title-neutral contract is proven.

## Documentation

Material changes to ownership, sequencing, dependencies, admission state, or repository status require corresponding Tactical Working Context reconciliation.
