import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve, memoize, pipe, neighbors } from '../src/domain/pathfinding/bfs.js';
import { createSearch } from '../src/infrastructure/search/worker-search.js';
import { Result, attempt, unwrap } from '../src/domain/result.js';
import * as validate from '../src/domain/validation.js';

const map = (values = {}) => ({
  width: 6,
  height: 6,
  obstacles: [],
  waypoints: [{ x: 2, y: 2, position: 0 }],
  ...values,
});
const p = (x, y) => ({ x, y });
test('BFS is pure, shortest, contiguous, and visits ordered waypoints', () => {
  const input = map({
    obstacles: [p(1, 0), p(1, 1)],
    waypoints: [
      { ...p(4, 1), position: 1 },
      { ...p(2, 2), position: 0 },
    ],
  });
  const before = structuredClone(input);
  const result = solve(input, p(0, 0), p(5, 5));
  assert.deepEqual(input, before);
  assert.deepEqual(result, solve(input, p(0, 0), p(5, 5)));
  assert.equal(result.distance, 12);
  assert.ok(
    result.path.findIndex((cell) => cell.x === 2 && cell.y === 2) <
      result.path.findIndex((cell) => cell.x === 4 && cell.y === 1),
  );
  result.path.forEach((cell, index) => {
    assert.ok(!input.obstacles.some((blocked) => validate.key(blocked) === validate.key(cell)));
    if (index)
      assert.equal(
        Math.abs(cell.x - result.path[index - 1].x) + Math.abs(cell.y - result.path[index - 1].y),
        1,
      );
  });
});
test('identical endpoints and duplicate segment boundaries', () => {
  const result = solve(map({ waypoints: [{ ...p(0, 0), position: 0 }] }), p(0, 0), p(0, 0));
  assert.deepEqual(result.path, [p(0, 0)]);
  assert.equal(result.distance, 0);
});
test('invalid maps and unreachable routes produce contextual errors', () => {
  const cases = [
    [map({ width: 0 }), p(0, 0), p(2, 2)],
    [map({ obstacles: undefined }), p(0, 0), p(2, 2)],
    [map({ waypoints: [] }), p(0, 0), p(2, 2)],
    [map(), p(-1, 0), p(2, 2)],
    [map(), p(0, 0), null],
    [map({ obstacles: [p(2, 2)] }), p(0, 0), p(3, 3)],
    [map({ obstacles: [p(0, 0)] }), p(0, 0), p(3, 3)],
    [
      map({
        waypoints: [
          { ...p(2, 2), position: 0 },
          { ...p(2, 2), position: 1 },
        ],
      }),
      p(0, 0),
      p(3, 3),
    ],
    [map({ waypoints: Array.from({ length: 17 }, (_, x) => p(x, 0)) }), p(0, 0), p(3, 3)],
  ];
  cases.forEach((args) => assert.throws(() => solve(...args), { status: 400 }));
  assert.throws(
    () => solve(map({ obstacles: Array.from({ length: 6 }, (_, y) => p(1, y)) }), p(0, 0), p(5, 5)),
    { status: 422 },
  );
  assert.throws(() => solve(map(), p(0, 0), p(5, 5), [p(2, 2)]), { status: 400 });
});
test('preferences avoid cells without mutating obstacle data', () => {
  const result = solve(map(), p(0, 0), p(5, 5), [p(1, 0)]);
  assert.ok(!result.path.some((cell) => cell.x === 1 && cell.y === 0));
  assert.equal(result.distance, 10);
});
test('memoization is bounded and returns independent values', () => {
  let calls = 0;
  const cached = memoize((value) => {
    calls += 1;
    return { value };
  }, 2);
  cached(1).value = 999;
  assert.equal(cached(1).value, 1);
  assert.equal(calls, 1);
  cached(2);
  cached(3);
  cached(1);
  assert.equal(calls, 4);
  assert.equal(
    pipe(
      (x) => x + 1,
      (x) => x * 2,
    )(2),
    6,
  );
  assert.equal(neighbors(map())(p(0, 0)).length, 2);
});
test('Result maps and chains success while preserving failure', () => {
  assert.equal(
    Result(true, 2)
      .map((x) => x + 1)
      .chain((x) => Result(true, x * 2)).value,
    6,
  );
  assert.equal(
    Result(false, 'error')
      .map(() => 1)
      .chain(() => Result(true, 2)).ok,
    false,
  );
  assert.equal(unwrap(attempt(() => 3)), 3);
  assert.throws(
    () =>
      unwrap(
        attempt(() => {
          throw new Error('failure');
        }),
      ),
    /failure/,
  );
});
test('input validation rejects ambiguous identifiers and invalid JSON values', () => {
  for (const value of ['0', '01', '1.2', '1e2', '-1', 'x', Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => validate.id(value));
  assert.equal(validate.id('12'), 12);
  for (const value of [null, [], 'string']) assert.throws(() => validate.object(value));
  for (const value of ['', ' '.repeat(3), 'x'.repeat(101), 3])
    assert.throws(() => validate.text(value, 'name'));
  assert.throws(() => validate.email('invalid'));
  assert.equal(validate.email(' A@EXAMPLE.COM '), 'a@example.com');
  assert.deepEqual(validate.preferences({}), { avoidCells: [] });
  assert.throws(() => validate.preferences({ avoidCells: 'invalid' }));
  assert.throws(() => validate.preferences({ avoidCells: [p(100, 2)] }));
});
test('large searches run concurrently in workers and preserve failures', async () => {
  const search = createSearch(2);
  const large = map({ width: 100, height: 100 });
  const first = search(large, p(0, 0), p(99, 99));
  const second = search(large, p(0, 0), p(99, 99));
  await assert.rejects(search(large, p(0, 0), p(99, 99)), { status: 503 });
  const results = await Promise.all([first, second]);
  assert.equal(results[0].distance, 198);
  await assert.rejects(search(large, p(-1, 0), p(99, 99)), { status: 400 });
  assert.equal((await search(map(), p(0, 0), p(5, 5))).distance, 10);
});
