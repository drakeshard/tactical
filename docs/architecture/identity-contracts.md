# Tactical Identity Contracts

TAC-I01 introduces two repository-local incubation identities:

- `TacticalEntityId` — opaque identity for something represented in Tactical state;
- `LocationId` — opaque identity for a logical battlefield location.

Both are branded string types. The string is caller-provided: Tactical does not generate IDs, impose UUID/content-key formats, or infer identity from host objects.

## Semantics

`TacticalEntityId` does not mean character, unit, RPG actor, combatant, or activation participant. A consuming game maps its own identity into Tactical identity at the composition boundary.

`LocationId` does not mean `(x, y)`, square, tile, world position, or renderer transform. Topology-specific code determines what locations mean and how they relate.

The two types are intentionally distinct even when their underlying serialized values happen to match.

## Representation and serialization

The incubation representation is a JSON-compatible string. Constructors brand caller-provided strings; serializers return the underlying string; deserializers restore the corresponding Tactical brand.

No validation policy is imposed yet. Empty strings, naming conventions, uniqueness, allocation, persistence namespaces, and collision handling are caller/content responsibilities unless later pressure-test evidence demonstrates a Tactical-owned invariant.

Equality is exact string equality within the same identity kind.

## Admission status

These contracts live under `src/core/` for repository-local incubation. They are not exported from `src/index.ts`, are not package subpaths, and are not stable `@drakeshard/tactical` gameplay API.
