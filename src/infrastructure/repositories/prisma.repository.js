import { fail } from '../../domain/result.js';
const mapInclude = {
  obstacles: { orderBy: { id: 'asc' } },
  waypoints: { orderBy: { position: 'asc' } },
};
const decode = (entity, row) => {
  if (!row) return null;
  if (entity === 'user') return { ...row, preferences: JSON.parse(row.preferences) };
  if (entity === 'route') return { ...row, path: JSON.parse(row.path) };
  return row;
};
const encode = (entity, data) =>
  entity === 'user'
    ? {
        ...data,
        ...(data.preferences === undefined
          ? {}
          : { preferences: JSON.stringify(data.preferences) }),
      }
    : entity === 'route'
      ? { ...data, path: JSON.stringify(data.path) }
      : data;

const checkedData = async (tx, entity, data) => {
  if (entity !== 'route') return encode(entity, data);
  const { expectedVersion, ...values } = data;
  const map = await tx.map.findUnique({ where: { id: values.mapId } });
  if (!map || map.version !== expectedVersion) fail(409, 'Map changed during search; retry');
  return encode(entity, values);
};
const invalidate = async (tx, mapId) => {
  await tx.map.update({ where: { id: mapId }, data: { version: { increment: 1 } } });
  await tx.route.deleteMany({ where: { mapId } });
};

// Both services and controllers depend on this small repository contract.
export const createRepository = (db) => ({
  list: async (entity, where = {}) =>
    (await db[entity].findMany({ where, orderBy: { id: 'asc' } })).map((row) =>
      decode(entity, row),
    ),
  get: async (entity, id) =>
    decode(
      entity,
      await db[entity].findUnique({
        where: { id },
        ...(entity === 'map' ? { include: mapInclude } : {}),
      }),
    ),
  create: async (entity, data) =>
    db.$transaction(async (tx) => {
      const row = await tx[entity].create({ data: await checkedData(tx, entity, data) });
      if (['obstacle', 'waypoint'].includes(entity)) await invalidate(tx, row.mapId);
      return decode(entity, row);
    }),
  update: async (entity, id, data) =>
    db.$transaction(async (tx) => {
      const row = await tx[entity].update({
        where: { id },
        data: await checkedData(tx, entity, data),
      });
      if (['map', 'obstacle', 'waypoint'].includes(entity))
        await invalidate(tx, entity === 'map' ? id : row.mapId);
      if (entity === 'user' && data.preferences !== undefined) {
        await tx.map.updateMany({ where: { userId: id }, data: { version: { increment: 1 } } });
        await tx.route.deleteMany({ where: { map: { userId: id } } });
      }
      return decode(entity, row);
    }),
  remove: async (entity, id) =>
    db.$transaction(async (tx) => {
      const row = await tx[entity].delete({ where: { id } });
      if (['obstacle', 'waypoint'].includes(entity)) await invalidate(tx, row.mapId);
    }),
});
