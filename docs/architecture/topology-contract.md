# Minimal Topology Contract

TAC-I02 introduces the smallest repository-local topology abstraction required by the Tactical architecture.

A `Topology` answers two questions:

1. whether a logical `LocationId` exists;
2. which logical locations are directly related to that location, in deterministic order.

## Deterministic ordering

Neighbor ordering is part of an implementation's contract. Callers must not rely on incidental `Set`, object-key, or hash-map iteration order. Concrete topologies define and test their order explicitly.

This ordering exists so later traversal, reachability, and pathfinding can have deterministic tie behavior without introducing random or renderer-derived ordering.

## Unknown locations

`neighbors(location)` returns `undefined` for an unknown location. The `topologyNeighbors` helper converts that into an explicit `unknown-location` result.

An existing location with no neighbors is distinct and returns a successful result containing an empty list.

## Deliberate omissions

The generic topology contract does not define:

- coordinates or dimensions;
- square/hex/zone semantics;
- distance;
- movement costs;
- passability;
- actor capability;
- occupancy;
- elevation;
- visibility or cover;
- pathfinding;
- a generic graph container or graph-algorithm toolkit.

Square-specific representation and ordering belong to TAC-I03.

## Admission status

The contract lives under `src/space/` for repository-local incubation. It is not exported from `src/index.ts` and is not a stable package subpath.
