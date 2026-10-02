# Composition Pressure Test

TAC-I14 composes the surviving Tactical incubation modules in a single headless fixture.

## Fixture boundary

The fixture begins with a hypothetical game-owned actor identity and maps it to `TacticalEntityId` at the composition boundary. Tactical does not import RPG or own the external actor model.

The composed scenario exercises:

- square topology;
- placement and occupancy;
- caller-owned traversal policy;
- reachability;
- lowest-cost pathfinding;
- logical elevation;
- square spatial queries;
- logical line of sight;
- cover observations;
- structural displacement.

Sequencing is intentionally absent following the TAC-I13 ownership decision.

## Evidence

The modules compose without:

- `@drakeshard/rpg`;
- `@drakeshard/foundation`;
- renderer, physics, browser, UI, or DOM state;
- a universal Tactical entity/character object;
- a package-wide result/event/command abstraction.

Movement capability and terrain interpretation remain caller-owned policy layered over Tactical facts.

## Admission status

This pressure test strengthens repository-local incubation evidence only. It does not admit stable package exports or authorize publication.
