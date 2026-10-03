# Chess — Tactical integration pressure test

This browser sample pressure-tests the repository-local Tactical incubation contracts against chess,
a materially different discrete-board consumer.

## What the sample exercises from Tactical

- `core/identity`: opaque Tactical entity ids for chess pieces.
- `square/topology`: the 8×8 logical board.
- `placement/placement`: authoritative piece placement and occupancy.
- `visibility/square-los`: structural line traces used by chess-owned sliding-piece obstruction
  checks.

Chess rules remain application-owned: piece kinds/colors, turns, legal-move semantics, captures,
check/checkmate, castling, en passant, promotion, and stalemate. The sample deliberately does
**not** force Tactical reachability/pathfinding into chess.

This is integration evidence only. It does not admit stable Tactical package exports, add runtime
dependencies, authorize npm publication, or change the empty root gameplay export.

## Verify

From the repository root:

```sh
pnpm verify
```

The root verification typechecks, tests, and builds this sample in addition to the Tactical library
gates.

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

## Controls

Select one of the side-to-move pieces, then select a highlighted legal destination. Use the
**Promotion** selector to choose queen, rook, bishop, or knight before moving a pawn to the final
rank.

The UI reports turn, check, checkmate, or stalemate and keeps a coordinate move log. Click
**Reset** to restore the standard initial position.

## Rule-hardening coverage

The sample tests ordinary occupancy blocking, checkmate, castling, en passant validation, promotion,
king-capture prevention, king-defended squares, castling-right bookkeeping, stalemate, and
byte-identical deterministic replay.
