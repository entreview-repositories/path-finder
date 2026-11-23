import { fail } from '../../domain/result.js';
import { id, text, dimensions, configuration } from '../../domain/validation.js';

export const createMapPolicy =
  ({ get }) =>
  async (input, current) => {
    const data = { ...current, ...input };
    const values = { name: text(data.name, 'name'), ...dimensions(data), userId: id(data.userId) };
    if (current && values.userId !== current.userId) fail(400, 'Map owner cannot be changed');
    await get('user', values.userId);
    configuration({
      ...values,
      obstacles: current?.obstacles ?? [],
      waypoints: current?.waypoints ?? [],
    });
    return values;
  };
