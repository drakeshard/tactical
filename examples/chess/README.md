# Chess — Tactical integration pressure test

This browser sample pressure-tests the repository-local Tactical incubation contracts against chess, a materially different discrete-board consumer.

## What the sample exercises from Tactical

- `core/identity`: opaque Tactical entity ids for chess pieces.
- `square/topology`: the 8×8 logical board.
- `placement/placement`: authoritative piece placement and occupancy.
- `visibility/square-los`: structural line traces used by chess-owned sliding-piece obstruction checks.

Chess rules remain application-owned: piece kinds/colors, turns, legal-move semantics, captures, check/checkmate, castling, en passant, promotion, and stalemate. The sample deliberately does **not** force Tactical reachability/pathfinding into chess.

This is integration evidence only. It does not admit stable Tactical package exports, add runtime dependencies, authorize npm publication, or change the empty root gameplay export.

## Verify

From the repository root:

```sh
pnpm verify
```

The root verification now typechecks/tests/builds this sample in addition to the existing Tactical library gates.

## Run locally

Build the sample:

```sh
pnpm chess:build
```

Then serve the repository root with any static HTTP server and open `/examples/chess/`. The checked-in HTML loads the emitted module graph under `examples/chess/dist/`.

## Controls

Select one of the side-to-move pieces, then select a highlighted legal destination. Promotion defaults to queen in the browser UI; the game model supports selecting queen, rook, bishop, or knight programmatically.

The UI reports turn, check, checkmate, or stalemate and keeps a coordinate move log. Click **Reset** to restore the standard initial position.
