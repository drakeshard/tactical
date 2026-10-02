# Spatial Queries

TAC-I09 adds only the square-specific queries demonstrated by current Tactical pressure tests.

## Included

- explicit Manhattan or Chebyshev distance;
- relative eight-way direction (plus `same`);
- bounded radius/neighborhood enumeration.

Radius enumeration is deterministic row-major order: ascending Y, then ascending X.

## Why these stay square-specific

These queries depend on square coordinates and square distance semantics. They therefore live under the square module instead of being promoted into the generic `Topology` contract.

A future non-square topology can define its own useful query vocabulary without inheriting Manhattan/Chebyshev assumptions.

## Non-goals

This module does not define targeting, ranges for attacks/abilities, areas of effect, faction filtering, occupancy filtering, visibility, cover, or a generic query DSL.

Those combinations remain caller/game policy.

## Admission status

Spatial queries remain repository-local incubation and are not stable package exports.
