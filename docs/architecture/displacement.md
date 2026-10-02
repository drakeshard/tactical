# Displacement

TAC-I12 adds a narrow structural forced-relocation operation over the placement/occupancy contract.

## Result

A successful displacement reports:

- displaced `TacticalEntityId`;
- previous logical locations;
- requested next logical locations;
- resulting placement state.

Placement/topology validation and caller-supplied occupancy policies remain authoritative for whether the relocation is structurally allowed.

## Non-ownership

Displacement does not decide or apply:

- damage;
- falling consequences;
- status effects;
- reactions/opportunity actions;
- interrupts;
- collision impulses;
- renderer animation;
- physics velocity;
- combat push/pull semantics.

A consuming game interprets the structural displacement result and composes any consequences externally.

## Admission status

Displacement remains repository-local incubation and is not a stable package export.
