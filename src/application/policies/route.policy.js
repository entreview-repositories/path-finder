import { fail } from '../../domain/result.js';
import { id } from '../../domain/validation.js';

export const createRoutePolicy =
  ({ get, search }) =>
  async (input, current) => {
    const mapId = id(input.mapId ?? current?.mapId);
    if (current && mapId !== current.mapId) fail(400, 'Map association cannot be changed');
    const map = await get('map', mapId);
    const owner = await get('user', map.userId);
    const start = input.start ?? (current && { x: current.startX, y: current.startY });
    const end = input.end ?? (current && { x: current.endX, y: current.endY });
    const result = await search(map, start, end, owner.preferences.avoidCells ?? []);
    return {
      mapId,
      expectedVersion: map.version,
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
      path: result.path,
      distance: result.distance,
      visitedCount: result.visitedCount,
    };
  };
