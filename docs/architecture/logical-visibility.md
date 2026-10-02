# Logical Visibility / Line of Sight

TAC-I10 adds a narrow square-grid logical line-of-sight observation based on the concrete geometry established by TAC-I03 and TAC-I09.

## Geometry

`squareLineTrace` uses a deterministic integer center-to-center line trace between two `SquareCoord` values.

This is logical battlefield geometry. It is not a renderer raycast, physics query, pixel test, camera test, or lighting system.

## Occlusion ownership

The caller supplies a `VisionBlocker` predicate for logical locations. Tactical does not decide which terrain/content types block vision.

Only interior locations can block a trace. The origin and target are endpoints and are not interpreted as blockers by this observation.

The result reports:

- whether the trace is visible;
- the complete deterministic logical trace;
- the first blocking location when blocked.

## Deliberate limits

This v0.1 incubation contract does not introduce:

- continuous geometry;
- renderer/physics authority;
- height-aware occlusion;
- field-of-view cones;
- fog of war;
- perception stats;
- attack targeting;
- visibility caches;
- a generic geometry framework.

If future pressure tests need different square corner/supercover semantics, that is a separate narrowing/change decision rather than hidden policy inside this contract.

## Admission status

Logical visibility remains repository-local incubation and is not a stable package export.
