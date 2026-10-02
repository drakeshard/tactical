# Traversal

TAC-I05 separates three concepts:

1. topology adjacency — which logical locations are structurally related;
2. traversal — ordered candidate transitions over those relationships;
3. caller movement policy — whether a transition is usable and its non-negative cost.

## Caller-owned policy

A `TraversalPolicy` receives `from` and `to` and returns either a finite non-negative cost or `undefined` to block the transition.

The policy is explicit operation input, not Tactical state. Tactical therefore does not own actor movement capabilities, AP, abilities, terrain balance, or title-specific meanings such as "requires Jump II".

## Structural cases

The same contract pressure-tests ordinary movement, blocked edges, ramps, climbs, jumps/gaps, drops, and one-way transitions.

Those labels are test scenarios, not shared enums. A topology may be directed, and a caller policy may independently allow one direction while rejecting the reverse.

## Determinism

Candidate order comes from the topology's deterministic neighbor order. Filtering blocked transitions preserves that order. Invalid costs are explicit failures rather than silently coerced values.

## Admission status

Traversal remains repository-local incubation and is not a stable package export.
