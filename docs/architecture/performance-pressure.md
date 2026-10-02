# Performance Pressure Test

TAC-I17 adds a repeatable measurement probe for representative Tactical incubation workloads.

The probe builds the current source and measures budgeted reachability, lowest-cost pathfinding, square radius enumeration, and logical line of sight over a deterministic 48×48 eight-neighbor square topology.

Performance timings are observational evidence, not pass/fail budgets. CI runners, developer machines, Node revisions, and host load differ. The probe fails only when the representative workload stops producing the expected semantic result kind.

Run:

```sh
pnpm performance:pressure
```

`pnpm verify` runs the probe after build and build-shape validation.

Current evidence does not justify caches/index frameworks, hierarchical pathfinding, workers, a spatial database, an external pathfinding dependency, or a generic navigation framework. Future optimization requires a concrete consumer workload and measured material problem.

The probe is repository tooling and does not add runtime dependencies or stable package exports.
