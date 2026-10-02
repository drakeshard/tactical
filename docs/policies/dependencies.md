# Dependency Policy

Runtime dependencies begin at zero.

A proposed dependency must document:

- the concrete Tactical problem;
- why repository-local implementation is insufficient;
- ownership and dependency direction;
- license and maintenance posture;
- transitive/runtime/bundle/security cost;
- deterministic-state implications;
- replacement/removal cost;
- the narrowest contract requiring the dependency.

`@drakeshard/rpg` is not an allowed Tactical dependency. `@drakeshard/foundation` requires a separate Foundation admission analysis and a concrete lower-level infrastructure gap. Renderer/UI/browser/physics/pathfinding packages are not admitted merely for convenience.

Dev dependencies used only for build/test/lint tooling are not Tactical runtime dependencies.
