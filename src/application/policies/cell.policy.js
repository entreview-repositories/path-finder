import { fail } from '../../domain/result.js';
import { id, integer, text, point, key, configuration } from '../../domain/validation.js';

export const createCellPolicies = ({ get }) => {
  const context = async (input, current) => {
    const data = { ...current, ...input };
    const mapId = id(data.mapId);
    if (current && mapId !== current.mapId) fail(400, 'Map association cannot be changed');
    const map = await get('map', mapId);
    return { data, map, values: { mapId, ...point(data, map) } };
  };
  return {
    obstacle: async (input, current) => {
      const { map, values } = await context(input, current);
      if (map.waypoints.some((cell) => key(cell) === key(values)))
        fail(409, 'Obstacle overlaps a waypoint');
      return values;
    },
    waypoint: async (input, current) => {
      const { data, map, values } = await context(input, current);
      const waypoint = {
        ...values,
        name: text(data.name, 'name'),
        position: integer(data.position, 'position', 0, 1000),
      };
      configuration({
        ...map,
        waypoints: [...map.waypoints.filter((cell) => cell.id !== current?.id), waypoint],
      });
      return waypoint;
    },
  };
};
