# Cover Observations

TAC-I11 adds square-specific structural cover observations over the logical visibility and square-direction contracts already proven by TAC-I09 and TAC-I10.

## Observation model

The caller supplies:

- logical vision blocking;
- whether a target location has cover toward a particular square direction.

Tactical determines the direction from the target toward the observer, verifies logical line of sight, and returns a cover fact.

If line of sight is blocked, cover is not separately observed.

## What the result means

`covered: true` means only that the caller-provided battlefield geometry reports structural cover on the target side facing the observer.

It does not mean:

- a hit chance modifier;
- armor;
- damage reduction;
- concealment percentage;
- full/half cover;
- attack legality;
- targeting success.

Those remain game/combat policy.

## Boundary

Cover state/content ownership remains with the caller. Tactical does not create a universal cover-material catalog or combat cover system.

The module remains repository-local incubation and is not a stable package export.
