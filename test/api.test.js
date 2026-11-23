import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { connectDatabase } from '../src/infrastructure/database/prisma.js';
import { createRepository } from '../src/infrastructure/repositories/prisma.repository.js';
import { createApp } from '../src/presentation/http/create-app.js';
import { createService } from '../src/application/create-service.js';
import { solve } from '../src/domain/pathfinding/bfs.js';

let database, repository, server, base, directory;
const logs = [];
before(async () => {
  directory = mkdtempSync(join(tmpdir(), 'path-finder-test-'));
  const filename = join(directory, 'test.db');
  const sqlite = new DatabaseSync(filename);
  sqlite.exec(
    readFileSync(
      new URL('../prisma/migrations/202611120001_initial/migration.sql', import.meta.url),
      'utf8',
    ),
  );
  sqlite.close();
  database = connectDatabase(`file:${filename}`);
  repository = createRepository(database);
  server = createApp(repository, { logger: (entry) => logs.push(JSON.parse(entry)) }).listen(
    0,
    '127.0.0.1',
  );
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await database.$disconnect();
  rmSync(directory, { recursive: true, force: true });
});
const request = async (path, method = 'GET', body, status = 200) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  assert.equal(response.status, status, `${method} ${path}: ${text}`);
  return text ? JSON.parse(text) : null;
};
const create = (resource, body) => request(`/api/${resource}`, 'POST', body, 201);
const fixture = async () => {
  const user = await create('users', {
    name: 'Student',
    email: `student-${crypto.randomUUID()}@example.com`,
  });
  const map = await create('maps', { name: 'Map', width: 8, height: 8, userId: user.id });
  const stop = await create('waypoints', { mapId: map.id, x: 3, y: 3, position: 0, name: 'Stop' });
  return { user, map, stop };
};
test('all five resources support persistent CRUD via HTTP', async () => {
  const { user, map, stop } = await fixture();
  const obstacle = await create('obstacles', { mapId: map.id, x: 1, y: 0 });
  const route = await create('routes', {
    mapId: map.id,
    start: { x: 0, y: 0 },
    end: { x: 7, y: 7 },
  });
  assert.equal(route.distance, 14);
  for (const [resource, row] of [
    ['users', user],
    ['maps', map],
    ['waypoints', stop],
    ['obstacles', obstacle],
    ['routes', route],
  ]) {
    const list = await request(
      `/api/${resource}${['users', 'maps'].includes(resource) ? '' : `?mapId=${map.id}`}`,
    );
    assert.ok(list.some((item) => item.id === row.id));
    assert.equal((await request(`/api/${resource}/${row.id}`)).id, row.id);
  }
  assert.deepEqual(
    (await request(`/api/routes/${route.id}`, 'PUT', { end: { x: 6, y: 7 } })).path.at(-1),
    { x: 6, y: 7 },
  );
  await request(`/api/routes/${route.id}`, 'DELETE', undefined, 204);
  await request(`/api/users/${user.id}`, 'PUT', { name: 'Updated' });
  await request(`/api/maps/${map.id}`, 'PATCH', { name: 'Updated map' });
  await request(`/api/obstacles/${obstacle.id}`, 'PUT', { x: 2, y: 0 });
  await request(`/api/waypoints/${stop.id}`, 'PATCH', { x: 4, name: 'Updated stop' });
  assert.equal((await request(`/api/maps/${map.id}`)).waypoints[0].x, 4);
  for (const [resource, row] of [
    ['obstacles', obstacle],
    ['waypoints', stop],
    ['maps', map],
    ['users', user],
  ]) {
    await request(`/api/${resource}/${row.id}`, 'DELETE', undefined, 204);
    await request(`/api/${resource}/${row.id}`, 'GET', undefined, 404);
  }
});
test('validation, conflicts, missing data, and endpoint errors', async () => {
  const { user, map, stop } = await fixture();
  await create('obstacles', { mapId: map.id, x: 1, y: 1 });
  await request('/api/users', 'POST', { name: 'Duplicate', email: user.email }, 409);
  await request('/api/users', 'POST', {}, 400);
  await request('/api/users', 'POST', null, 400);
  await request(
    '/api/maps',
    'POST',
    { name: 'Invalid', width: 101, height: 3, userId: user.id },
    400,
  );
  await request('/api/maps', 'POST', { name: 'Missing', width: 5, height: 5, userId: 999999 }, 404);
  await request(`/api/maps/${map.id}`, 'PATCH', { width: 2 }, 400);
  await request(`/api/maps/${map.id}`, 'PATCH', { userId: 999 }, 400);
  await request('/api/obstacles', 'POST', { mapId: map.id, x: 3, y: 3 }, 409);
  await request('/api/obstacles', 'POST', { mapId: map.id, x: 1, y: 1 }, 409);
  await request('/api/obstacles', 'POST', { mapId: map.id, x: -1, y: 0 }, 400);
  await request(
    '/api/waypoints',
    'POST',
    { mapId: map.id, x: 1, y: 1, name: 'Blocked', position: 1 },
    400,
  );
  await request(
    '/api/waypoints',
    'POST',
    { mapId: map.id, x: 5, y: 5, name: 'Duplicate order', position: 0 },
    409,
  );
  await request(`/api/waypoints/${stop.id}`, 'PATCH', { mapId: map.id + 1 }, 400);
  for (const resource of ['users', 'maps', 'obstacles', 'waypoints', 'routes']) {
    await request(`/api/${resource}/bad`, 'GET', undefined, 400);
    await request(`/api/${resource}/999999`, 'GET', undefined, 404);
    await request(`/api/${resource}/999999`, 'DELETE', undefined, 404);
    await request(`/api/${resource}/999999`, 'PUT', {}, 404);
  }
  await request('/api/routes?mapId=bad', 'GET', undefined, 400);
  await request('/missing', 'GET', undefined, 404);
  await request('/api/health');
  const malformed = await fetch(`${base}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(malformed.status, 400);
  assert.ok(logs.some((entry) => entry.status === 409));
});
test('map edits, preferences and cascading deletes invalidate saved routes', async () => {
  const { user, map, stop } = await fixture();
  const routeData = { mapId: map.id, start: { x: 0, y: 0 }, end: { x: 7, y: 7 } };
  const makeRoute = () => create('routes', routeData);
  const empty = async () => assert.deepEqual(await request(`/api/routes?mapId=${map.id}`), []);
  await makeRoute();
  const obstacle = await create('obstacles', { mapId: map.id, x: 2, y: 0 });
  await empty();
  await makeRoute();
  await request(`/api/obstacles/${obstacle.id}`, 'PATCH', { x: 2, y: 1 });
  await empty();
  await makeRoute();
  await request(`/api/obstacles/${obstacle.id}`, 'DELETE', undefined, 204);
  await empty();
  await makeRoute();
  await request(`/api/waypoints/${stop.id}`, 'PATCH', { x: 4 });
  await empty();
  await makeRoute();
  await request(`/api/maps/${map.id}`, 'PATCH', { name: 'Renamed' });
  await empty();
  await makeRoute();
  await request(`/api/users/${user.id}`, 'PATCH', {
    preferences: { avoidCells: [{ x: 1, y: 0 }] },
  });
  await empty();
  const route = await makeRoute();
  assert.ok(!route.path.some((cell) => cell.x === 1 && cell.y === 0));
  await request(`/api/users/${user.id}`, 'DELETE', undefined, 204);
  await request(`/api/maps/${map.id}`, 'GET', undefined, 404);
  await request(`/api/waypoints/${stop.id}`, 'GET', undefined, 404);
  await request(`/api/routes/${route.id}`, 'GET', undefined, 404);
});
test('unreachable routes and missing stops are rejected and not saved', async () => {
  const { map, stop } = await fixture();
  for (let y = 0; y < map.height; y += 1) await create('obstacles', { mapId: map.id, x: 1, y });
  const data = { mapId: map.id, start: { x: 0, y: 0 }, end: { x: 7, y: 7 } };
  await request('/api/routes', 'POST', data, 422);
  assert.deepEqual(await request(`/api/routes?mapId=${map.id}`), []);
  await request(`/api/waypoints/${stop.id}`, 'DELETE', undefined, 204);
  await request('/api/routes', 'POST', data, 400);
});
test('repository rejects stale computations and persists across connections', async () => {
  const { map } = await fixture();
  const current = await repository.get('map', map.id);
  const service = createService(repository, async (...args) => {
    const result = solve(...args);
    await repository.update('map', map.id, { name: 'Changed concurrently' });
    return result;
  });
  await assert.rejects(
    service.create('route', { mapId: map.id, start: { x: 0, y: 0 }, end: { x: 7, y: 7 } }),
    { status: 409 },
  );
  await assert.rejects(
    repository.create('route', {
      mapId: 999999,
      expectedVersion: current.version,
      startX: 0,
      startY: 0,
      endX: 1,
      endY: 1,
      path: [],
      distance: 0,
      visitedCount: 0,
    }),
    { status: 409 },
  );
  const second = connectDatabase(`file:${join(directory, 'test.db')}`);
  assert.equal(
    (await second.map.findUnique({ where: { id: map.id } })).name,
    'Changed concurrently',
  );
  await second.$disconnect();
});

test('HTTP middleware rejects non-JSON bodies before touching persistence', async () => {
  const response = await fetch(`${base}/api/maps`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'invalid input',
  });
  assert.equal(response.status, 415);
  assert.equal((await response.json()).error, 'Use Content-Type application/json');
});
