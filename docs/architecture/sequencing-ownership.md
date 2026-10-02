# Sequencing Ownership Spike

TAC-I13 asks whether participant order, current opportunity, advancement, and round boundaries form an independently Tactical responsibility.

## Pressure-test result

**Decision for v0.1: keep sequencing outside Tactical.**

The current Tactical modules describe battlefield structure and deterministic spatial facts/transitions without requiring an activation model. The same Tactical placement/topology state can be composed with different external opportunity orders without changing Tactical semantics.

A title-neutral pressure fixture demonstrates that:

- a consuming game can map its participants to `TacticalEntityId`;
- multiple game-owned ordering policies can operate over the same Tactical state;
- opportunity advancement does not require topology, placement, traversal, movement, elevation, visibility, cover, or displacement state;
- sequencing state can be serialized independently by the game.

That means current evidence does not establish an intrinsic Tactical invariant strong enough to justify a sequencing module.

## Why not admit a generic scheduler

A generic scheduler would only become useful by absorbing policy that TAC-ARCH-001 intentionally leaves outside Tactical, such as:

- AP/action economy;
- initiative/speed formulas;
- abilities and cooldowns;
- reactions/interrupts;
- combat resolution;
- encounter objectives;
- title-specific round/phase rules.

Creating participant/current-index/round counters without those semantics would be a generic utility abstraction rather than a Tactical-owned mechanism.

## Revisit trigger

Sequencing may be reconsidered only if a current consumer demonstrates a reusable invariant that:

1. remains meaningful without AP, combat, abilities, cooldowns, reactions, or title-specific encounter policy;
2. requires Tactical-owned state or compatibility semantics;
3. survives at least one concrete composition pressure test more cleanly inside Tactical than outside it.

Until then, sequencing remains game/application-owned.

## Admission status

No sequencing source module or package export is admitted by TAC-I13.
