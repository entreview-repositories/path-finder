import { fail } from './result.js';

export const object = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail(400, 'Expected a JSON object');
  return value;
};
export const integer = (value, name, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    fail(400, `${name} must be an integer between ${min} and ${max}`);
  return value;
};
export const id = (value) => {
  if (!/^[1-9]\d*$/.test(String(value))) fail(400, 'Invalid ID');
  return integer(Number(value), 'ID', 1);
};
export const text = (value, name) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 100)
    fail(400, `${name} must contain 1 to 100 characters`);
  return value.trim();
};
export const point = (value, map) => {
  object(value);
  return {
    x: integer(value.x, 'x', 0, map.width - 1),
    y: integer(value.y, 'y', 0, map.height - 1),
  };
};
export const key = ({ x, y }) => `${x},${y}`;
export const dimensions = (data) => ({
  width: integer(data.width, 'width', 2, 100),
  height: integer(data.height, 'height', 2, 100),
});
export const preferences = (value) => {
  object(value);
  const cells = value.avoidCells ?? [];
  if (!Array.isArray(cells) || cells.length > 10000)
    fail(400, 'avoidCells must be an array of up to 10000 coordinates');
  return { avoidCells: cells.map((cell) => point(cell, { width: 100, height: 100 })) };
};
export const email = (value) => {
  const normalized = text(value, 'email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) fail(400, 'Invalid email');
  return normalized;
};
export const configuration = (map) => {
  dimensions(map);
  if (!Array.isArray(map.obstacles) || !Array.isArray(map.waypoints))
    fail(400, 'Map must define obstacles and waypoints arrays');
  if (map.waypoints.length > 16) fail(400, 'At most 16 waypoints are supported');
  const blocked = new Set(map.obstacles.map((cell) => key(point(cell, map))));
  const stops = new Set();
  map.waypoints.forEach((cell) => {
    const location = key(point(cell, map));
    if (blocked.has(location) || stops.has(location))
      fail(400, 'Waypoints must be distinct and cannot overlap obstacles');
    stops.add(location);
  });
  return map;
};
