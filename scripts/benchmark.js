import { performance } from 'node:perf_hooks';
import { solve } from '../src/domain/pathfinding/bfs.js';
import { createSearch } from '../src/infrastructure/search/worker-search.js';

const map = { width: 100, height: 100, obstacles: [], waypoints: [{ x: 50, y: 50, position: 0 }] };
const start = { x: 0, y: 0 },
  end = { x: 99, y: 99 };
const before = process.memoryUsage().heapUsed;
const started = performance.now();
for (let index = 0; index < 50; index += 1) solve(map, start, end);
const elapsed = performance.now() - started;
const search = createSearch();
const parallelStart = performance.now();
const results = await Promise.all([search(map, start, end), search(map, end, start)]);
console.log(
  JSON.stringify(
    {
      iterations: 50,
      map: '100x100',
      totalMs: Math.round(elapsed),
      averageMs: elapsed / 50,
      heapDeltaMB: (process.memoryUsage().heapUsed - before) / 1024 / 1024,
      parallelMs: performance.now() - parallelStart,
      distances: results.map((result) => result.distance),
      note: 'Heap delta includes uncollected allocations; this smoke benchmark does not prove absence of memory leaks.',
    },
    null,
    2,
  ),
);
