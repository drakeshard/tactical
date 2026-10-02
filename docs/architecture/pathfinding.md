# Pathfinding

TAC-I07 adds deterministic lowest-cost path search and reconstruction over the existing topology + traversal-policy seam.

## Determinism

The search finalizes the lowest accumulated cost first. Equal-cost pending locations use discovery order, and discovery order comes from deterministic topology/traversal ordering.

If the same location is reached again at exactly the same cost, the first discovered predecessor is retained. This makes equal-cost path selection stable without random tie-breaking.

## Result

A successful path contains the ordered `LocationId` sequence from start through goal plus total traversal cost.

Unknown endpoints, unreachable goals, and invalid traversal costs are explicit outcomes.

## Boundary

This module does not add heuristic/A* policy, hierarchical navigation, actor capability, AP/action economy, AI intent, renderer navigation, or an external pathfinding dependency.

The implementation is intentionally narrow. Future optimization is evidence-driven by TAC-I17.

The module remains repository-local incubation and is not a stable package export.
