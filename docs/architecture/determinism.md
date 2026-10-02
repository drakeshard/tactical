# Determinism Review

TAC-I16 locks the deterministic behavior relied on by the surviving Tactical incubation modules.

## Locked ordering contracts

### Square topology

Square neighbor order is the declared square-direction order with out-of-bounds locations filtered without reordering:

1. north;
2. north-east;
3. east;
4. south-east;
5. south;
6. south-west;
7. west;
8. north-west.

Four-neighbor topology uses north, east, south, west in that order.

### Reachability and pathfinding

Search selects the pending location with the lowest accumulated cost. Equal-cost pending locations are finalized in first-discovered sequence order.

Neighbor discovery follows topology order. An equal-cost alternative does not replace an already recorded equal-cost route. Therefore equal-cost path selection is deterministic from the topology and traversal policy order supplied by the caller.

No random tie-breaking is allowed.

### Placement

Placement state preserves entity insertion order. Relocating an entity preserves its position in the placement list and preserves the caller-provided location order.

### Spatial queries

Square radius queries enumerate coordinates row-major by increasing `y`, then increasing `x`, filtering the requested metric without reordering.

### Logical visibility

Square logical line traces follow the deterministic integer line algorithm implemented by `squareLineTrace`. The first interior location for which the caller reports a blocker is the blocking observation.

### Serialization

Current plain Tactical arrays preserve their represented ordering through JSON serialization. Tactical does not canonicalize unrelated game data or invent an aggregate save format.

## Repeatability rule

For identical definitions, Tactical state, ordered caller inputs, topology, and policy values, authoritative Tactical operations must produce equal structural results.

Hidden randomness, wall-clock time, renderer/frame state, implicit timers, and nondeterministic tie-breaking remain prohibited by the architecture guard.

## Change control

Changing any ordering rule documented here is a compatibility-sensitive Tactical behavior change during incubation and must be intentional, tested, and reconciled before extraction.

## Admission status

This review locks repository-local incubation behavior. It does not admit a stable package surface.
