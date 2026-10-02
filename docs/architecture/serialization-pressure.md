# Serialization and Persistence Pressure

TAC-I15 verifies that current Tactical incubation state remains plain, deterministic data suitable for a game-owned persistence boundary.

## Evidence

The pressure tests round-trip:

- `TacticalEntityId` and `LocationId` serialized representations;
- placement state;
- elevation state;
- list/order information relied on by deterministic behavior.

JSON round trips preserve the represented values and ordering without renderer, browser, service, or hidden singleton state.

## Ownership boundary

Tactical does **not** introduce:

- a save envelope;
- save slots;
- storage APIs;
- browser/IndexedDB adapters;
- aggregate game save versions;
- migration orchestration;
- automatic parsing of arbitrary persisted JSON.

A consuming game owns the aggregate save payload and determines when/how persisted data is trusted or migrated. Foundation persistence may be composed by a game without Tactical importing Foundation.

Current module operations continue to validate the invariants they own when state transitions are requested. TAC-I15 does not invent a universal Tactical decoder merely because external JSON can be malformed.

## Compatibility status

Repository-local state is serialization-friendly evidence, not a promise of a versioned stable persistence format. A compatibility/versioned Tactical persistence contract requires separate extraction evidence.

## Admission status

No stable package export or persistence service is admitted by TAC-I15.
