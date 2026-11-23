import { fail, attempt, unwrap } from '../result.js';
import { configuration, key, point } from '../validation.js';

export const pipe =
  (...operations) =>
  (value) =>
    operations.reduce((result, operation) => operation(result), value);
const directions = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];
export const neighbors =
  (map) =>
  ({ x, y }) =>
    directions
      .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .filter((cell) => cell.x >= 0 && cell.y >= 0 && cell.x < map.width && cell.y < map.height);

// An iterator exposes BFS progress lazily without retaining a full path per node.
export const searchSteps = (map, start, end, blocked) => ({
  *[Symbol.iterator]() {
    const queue = [start];
    const parents = new Map([[key(start), null]]);
    for (let head = 0; head < queue.length; head += 1) {
      const current = queue[head];
      if (key(current) === key(end)) {
        const path = [];
        for (let cell = current; cell; cell = parents.get(key(cell))) path.push(cell);
        yield { done: true, path: path.reverse(), visitedCount: parents.size };
        return;
      }
      neighbors(map)(current)
        .filter((cell) => !blocked.has(key(cell)) && !parents.has(key(cell)))
        .forEach((cell) => {
          parents.set(key(cell), current);
          queue.push(cell);
        });
      yield { done: false, visitedCount: parents.size };
    }
    fail(422, 'No route exists through all required waypoints');
  },
});

const segment = (map, start, end, blocked) => {
  for (const progress of searchSteps(map, start, end, blocked)) {
    if (progress.done) return progress;
  }
};

// Recursion is bounded to 17 segments; BFS itself remains iterative for large maps.
const connect = (map, stops, blocked, index = 0, path = [], visitedCount = 0) => {
  if (index === stops.length - 1) return { path, distance: path.length - 1, visitedCount };
  const next = segment(map, stops[index], stops[index + 1], blocked);
  return connect(
    map,
    stops,
    blocked,
    index + 1,
    [...path, ...next.path.slice(index === 0 ? 0 : 1)],
    visitedCount + next.visitedCount,
  );
};

export const solve = (map, start, end, avoidCells = []) =>
  unwrap(
    attempt(() => {
      configuration(map);
      point(start, map);
      point(end, map);
      if (!map.waypoints.length) fail(400, 'At least one waypoint is required');
      const blocked = new Set(
        [...map.obstacles, ...avoidCells].map((cell) => key(point(cell, map))),
      );
      const stops = pipe(
        (cells) => [...cells].sort((a, b) => a.position - b.position),
        (cells) => [start, ...cells.map((cell) => point(cell, map)), end],
      )(map.waypoints);
      if (stops.some((cell) => blocked.has(key(cell))))
        fail(400, 'Start, destination and waypoints must be traversable');
      return connect(map, stops, blocked);
    }).map((result) => ({ ...result, algorithm: 'BFS', waypointOrder: 'position' })),
  );

export const memoize = (operation, limit = 32) => {
  const cache = new Map();
  return (...args) => {
    const cacheKey = JSON.stringify(args);
    if (!cache.has(cacheKey)) {
      const result = operation(...args);
      if (cache.size >= limit) cache.delete(cache.keys().next().value);
      cache.set(cacheKey, structuredClone(result));
    }
    return structuredClone(cache.get(cacheKey));
  };
};
