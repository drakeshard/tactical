import type { LocationId, TacticalEntityId } from "../core/identity.js";
import {
  locationsOf,
  type PlacementPolicy,
  type PlacementRejected,
  type PlacementState,
  relocateEntity,
} from "../placement/placement.js";
import type { Topology } from "../space/topology.js";

export type DisplacementResult =
  | {
      readonly kind: "displaced";
      readonly entity: TacticalEntityId;
      readonly from: readonly LocationId[];
      readonly to: readonly LocationId[];
      readonly state: PlacementState;
    }
  | {
      readonly kind: "rejected";
      readonly reason: PlacementRejected;
    };

export function displaceEntity(
  state: PlacementState,
  topology: Topology,
  entity: TacticalEntityId,
  to: readonly LocationId[],
  policies: readonly PlacementPolicy[] = [],
): DisplacementResult {
  const from = locationsOf(state, entity);
  if (from === undefined) {
    return { kind: "rejected", reason: { kind: "entity-not-placed", entity } };
  }

  const relocated = relocateEntity(state, topology, entity, to, policies);
  if (relocated.kind === "rejected") return relocated;

  return {
    kind: "displaced",
    entity,
    from: [...from],
    to: [...to],
    state: relocated.state,
  };
}
