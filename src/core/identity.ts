declare const tacticalEntityIdBrand: unique symbol;
declare const locationIdBrand: unique symbol;

/**
 * Opaque identity for something represented in Tactical state.
 *
 * The value does not imply RPG actor, character, unit, or other host semantics.
 */
export type TacticalEntityId = string & {
  readonly [tacticalEntityIdBrand]: "TacticalEntityId";
};

/**
 * Opaque identity for a logical battlefield location.
 *
 * The value does not imply coordinates or a particular topology.
 */
export type LocationId = string & {
  readonly [locationIdBrand]: "LocationId";
};

export function tacticalEntityId(value: string): TacticalEntityId {
  return value as TacticalEntityId;
}

export function locationId(value: string): LocationId {
  return value as LocationId;
}

export function tacticalEntityIdsEqual(
  left: TacticalEntityId,
  right: TacticalEntityId,
): boolean {
  return left === right;
}

export function locationIdsEqual(left: LocationId, right: LocationId): boolean {
  return left === right;
}

export function serializeTacticalEntityId(id: TacticalEntityId): string {
  return id;
}

export function deserializeTacticalEntityId(value: string): TacticalEntityId {
  return tacticalEntityId(value);
}

export function serializeLocationId(id: LocationId): string {
  return id;
}

export function deserializeLocationId(value: string): LocationId {
  return locationId(value);
}
