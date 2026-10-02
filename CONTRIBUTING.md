# Contributing to Drakeshard Tactical

## Authority

TAC-ARCH-001 and TAC-PLAN-001 in controlled Drakeshard documentation define Tactical ownership and sequencing. GitHub issues define executable repository work.

## Workflow

- Work from a GitHub issue and focused branch.
- Keep one issue/PR narrowly scoped.
- Run `pnpm verify` before opening or updating a PR.
- Do not broaden Tactical ownership to solve a title-local concern.
- Do not add runtime dependencies without explicit admission analysis.
- Do not import RPG, renderer, UI, or browser concerns into authoritative Tactical source.

## Incubation/public-surface rule

Incubation modules may exist under `src/`, but the package remains private and `src/index.ts` remains an empty stable gameplay entry point until TAC-I19 or another controlled admission decision explicitly changes that rule.

## Determinism

Authoritative operations must make relevant policy/input/order explicit. Do not use hidden random sources, wall clocks, timers, renderer state, or unspecified tie-breaking.

## License

Contributions are accepted under Apache-2.0 unless controlled governance records an explicit exception.
