# Reachability

TAC-I06 adds deterministic reachable-set search over the topology + traversal-policy seam.

## Inputs

Reachability receives:

- a topology;
- a start `LocationId`;
- an explicit finite non-negative movement budget;
- a caller-supplied `TraversalPolicy`.

The budget is a search input only. Tactical does not interpret it as AP, stamina, an action resource, or an actor-owned stat.

## Determinism

The search uses lowest accumulated cost first. Equal-cost candidates are finalized in discovery order, and discovery order comes from the topology's deterministic neighbor order after traversal-policy filtering.

When the same location is discovered again at the same cost, the first route wins. Random tie-breaking is not used.

The returned list is ordered by finalization order and includes the start at cost zero.

## Invalid input

Unknown starts, invalid budgets, and invalid traversal costs are explicit structured outcomes.

## Boundary

Reachability does not own path reconstruction, AP/action economy, actor capability, AI planning, renderer state, or random tie-breaking.

The module remains repository-local incubation and is not a stable package export.
