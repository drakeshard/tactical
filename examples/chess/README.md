# Chess — Tactical integration pressure test

Public test page: https://drakeshard.github.io/tactical/

This browser sample pressure-tests the repository-local Tactical incubation contracts against chess,
a materially different discrete-board consumer.

## What the sample exercises from Tactical

- `core/identity`: opaque Tactical entity ids for chess pieces.
- `square/topology`: the 8×8 logical board.
- `placement/placement`: authoritative piece placement and occupancy.
- `visibility/square-los`: structural line traces used by chess-owned sliding-piece obstruction
  checks.

Chess rules remain application-owned: piece kinds/colors, turns, legal-move semantics, captures,
check/checkmate, castling, en passant, promotion, stalemate, clocks, game setup, and local AI. The
sample deliberately does **not** force Tactical reachability/pathfinding, turn management, timers,
or AI into the shared library.

This is integration evidence only. It does not admit stable Tactical package exports, add runtime
dependencies, authorize npm publication, or change the empty root gameplay export.

## Play modes

The page supports:

- local two-player chess;
- local deterministic AI with Easy, Normal, and Hard bounded search levels;
- choosing White or Black against AI;
- 3-minute, 5-minute, 10-minute, and Unlimited clocks;
- explicit queen, rook, bishop, or knight promotion preference.

The side to move is highlighted and only that side's clock runs. A finite clock reaching zero ends
the sample game on time.

## Verify

From the repository root:

```sh
pnpm verify
```

The root verification typechecks, tests, and builds this sample in addition to the Tactical library
gates. AI and clock behavior have deterministic unit coverage.

## Run locally

Build only the sample:

```sh
pnpm chess:build
```

Or build and serve it with the repository's zero-dependency Node preview server:

```sh
pnpm chess:preview
```

Then open the URL printed by the preview command. By default it is
`http://127.0.0.1:4173/examples/chess/`.

## Rule-hardening coverage

The sample tests ordinary occupancy blocking, checkmate, castling, en passant validation, promotion,
king-capture prevention, king-defended squares, castling-right bookkeeping, stalemate,
byte-identical deterministic replay, deterministic AI choice, and clock behavior.
