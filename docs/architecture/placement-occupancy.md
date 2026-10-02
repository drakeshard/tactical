# Placement and Occupancy

TAC-I04 introduces plain Tactical placement state that associates a `TacticalEntityId` with one or more `LocationId` values.

## Genericity

The core representation intentionally supports:

- one entity occupying multiple locations;
- multiple entities occupying the same location;
- topology-defined logical locations without coordinate assumptions.

Therefore one-cell/one-entity is not Tactical ontology.

The first consumer can opt into `exclusiveOccupancyPolicy`, which rejects a placement when any requested location is already occupied. That policy is explicit input to the operation and is not embedded into identity, location, or placement state.

## Operations

Placement operations are explicit and return structured outcomes:

- place;
- relocate;
- remove;
- rejected with a concrete reason.

Unknown locations, duplicate locations, empty location sets, already-placed entities, missing entities, and occupancy conflicts are deterministic explicit outcomes.

## State and ordering

Placement state is plain JSON-compatible data. Placement order and per-entity location order are preserved. Occupancy queries return entities in placement-state order.

No renderer object, physics body, RPG actor, movement cost, or combat meaning is stored in Tactical placement state.

## Admission status

Placement/occupancy remains repository-local incubation and is not exported from the stable package surface.
