# Elevation

TAC-I08 adds optional discrete logical elevation keyed by `LocationId`.

## Semantics

Elevation levels are safe integers and may be negative, zero, or positive. They are logical Tactical facts only.

The module does not define a conversion to meters, pixels, world-space Y/Z, physics height, or renderer transforms.

## Operations

Callers may set, update, query, remove, and compare elevation levels. Unknown locations and non-discrete levels are explicit rejections.

Missing elevation remains missing; Tactical does not silently assign a universal level zero.

`elevationDifference` reports only the signed structural difference between two known levels.

## Non-ownership

Games remain responsible for:

- climb/jump/drop capability policy;
- movement costs associated with height;
- high-ground bonuses;
- fall damage;
- line-of-sight consequences;
- renderer/world height;
- title-specific terrain semantics.

## Admission status

Elevation remains optional repository-local incubation and is not a stable package export.
