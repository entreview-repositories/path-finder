import { fail } from '../domain/result.js';
import { id, object } from '../domain/validation.js';
import { createResourcePolicies } from './resource-policies.js';

/** Application entry point: depends on repository and search contracts, never HTTP or Prisma. */
export const createService = (repository, search) => {
  const get = async (entity, rawId) => {
    const record = await repository.get(entity, id(rawId));
    if (!record) fail(404, `${entity} not found`);
    return record;
  };
  const policies = createResourcePolicies({ get, search });
  const prepare = (entity, input, current) => policies[entity](object(input), current);

  return {
    get,
    list: (entity, mapId) =>
      repository.list(entity, mapId === undefined ? {} : { mapId: id(mapId) }),
    create: async (entity, input) => repository.create(entity, await prepare(entity, input)),
    update: async (entity, rawId, input) => {
      const current = await get(entity, rawId);
      const values = await prepare(entity, input, current);
      return repository.update(entity, current.id, values);
    },
    remove: async (entity, rawId) => {
      const current = await get(entity, rawId);
      await repository.remove(entity, current.id);
    },
  };
};
