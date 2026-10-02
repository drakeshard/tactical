# Square Topology

TAC-I03 is the first concrete implementation of the generic relational topology contract.

## Representation

`SquareCoord` is square-specific and contains integer `x` and `y` components. Generic Tactical code continues to use `LocationId`.

The square module encodes a coordinate as a square-specific `LocationId` string. This does not redefine `LocationId` globally as coordinates.

## Ordering

Four-way neighbors are ordered north, east, south, west.

Eight-way neighbors are ordered north, north-east, east, south-east, south, south-west, west, north-west.

That order is explicit and tested so later traversal/search logic can use deterministic tie behavior.

## Diagonal seam

`SquareAdjacency` chooses structural four-way or eight-way adjacency. It does not decide whether a particular actor can move diagonally, whether corner-cutting is legal, or what a diagonal costs. Those are traversal/movement-policy concerns.

## Boundaries and distance

Square bounds are inclusive logical bounds and are validated before a topology is created.

The module exposes explicit Manhattan and Chebyshev distance helpers. Neither is treated as a generic Tactical distance metric.

## Non-goals

This module does not introduce hex/zone/continuous topologies, movement costs, actor capability, occupancy, terrain rules, pathfinding, renderer coordinates, or renderer physics.

The module remains repository-local incubation and is not a stable package export.
