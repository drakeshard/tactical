import { performance } from "node:perf_hooks";

import { lowestCostPath } from "../dist/movement/pathfinding.js";
import { reachableLocations } from "../dist/movement/reachability.js";
import { squareLocationsWithinRadius } from "../dist/square/queries.js";
import { createSquareTopology, squareLocationId } from "../dist/square/topology.js";
import { squareLineOfSight } from "../dist/visibility/square-los.js";

const definition = {
  bounds: { minX: 0, maxX: 47, minY: 0, maxY: 47 },
  adjacency: "eight",
};

const topology = createSquareTopology(definition);
if (!topology) throw new Error("performance topology invalid");

function measure(name, iterations, operation) {
  const started = performance.now();
  let sample;
  for (let index = 0; index < iterations; index += 1) sample = operation();
  const durationMs = performance.now() - started;
  return { name, iterations, durationMs, averageMs: durationMs / iterations, sample };
}

const traversal = () => 1;
const results = [
  measure("reachability", 8, () =>
    reachableLocations(topology, squareLocationId({ x: 24, y: 24 }), 18, traversal),
  ),
  measure("pathfinding", 8, () =>
    lowestCostPath(
      topology,
      squareLocationId({ x: 0, y: 0 }),
      squareLocationId({ x: 47, y: 47 }),
      traversal,
    ),
  ),
  measure("spatial-radius", 100, () =>
    squareLocationsWithinRadius(definition, { x: 24, y: 24 }, 12, "chebyshev"),
  ),
  measure("logical-los", 500, () =>
    squareLineOfSight(definition, { x: 0, y: 0 }, { x: 47, y: 31 }, () => false),
  ),
];

const [reachability, pathfinding, radius, visibility] = results;
if (reachability?.sample?.kind !== "reachable") throw new Error("reachability scenario failed");
if (pathfinding?.sample?.kind !== "path") throw new Error("pathfinding scenario failed");
if (radius?.sample?.kind !== "locations") throw new Error("spatial-radius scenario failed");
if (visibility?.sample?.kind !== "observed") throw new Error("logical-LoS scenario failed");

console.log(
  JSON.stringify(
    {
      scenario: {
        topology: "square-48x48-eight-neighbor",
        reachabilityBudget: 18,
        spatialRadius: 12,
        path: ["0,0", "47,47"],
        lineOfSight: ["0,0", "47,31"],
      },
      measurements: results.map(({ name, iterations, durationMs, averageMs }) => ({
        name,
        iterations,
        durationMs: Number(durationMs.toFixed(3)),
        averageMs: Number(averageMs.toFixed(3)),
      })),
      note: "Measurements are observational only; no universal timing threshold is enforced.",
    },
    null,
    2,
  ),
);
