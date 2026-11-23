import { same } from '../state/editor.store.js';
export const drawMap = (canvas, state) => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!state.map) {
    ctx.fillStyle = '#60756a';
    ctx.font = '16px sans-serif';
    ctx.fillText('Your map will appear here.', 30, 45);
    return;
  }
  const map = state.map;
  const size = Math.max(4, Math.floor(Math.min(600 / map.width, 440 / map.height)));
  canvas.width = map.width * size;
  canvas.height = map.height * size;
  for (let y = 0; y < map.height; y += 1)
    for (let x = 0; x < map.width; x += 1) {
      const cell = { x, y };
      const waypoint = map.waypoints.find((item) => same(item, cell));
      ctx.fillStyle = same(state.start, cell)
        ? '#247449'
        : same(state.end, cell)
          ? '#c25b38'
          : waypoint
            ? '#d4a62d'
            : map.obstacles.some((item) => same(item, cell))
              ? '#344b41'
              : state.path.some((item) => same(item, cell))
                ? '#abd9bd'
                : '#f1f5ef';
      ctx.fillRect(x * size, y * size, size - 1, size - 1);
      if (size >= 20) {
        ctx.font = `${Math.max(10, Math.floor(size / 3))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        const label = same(state.start, cell)
          ? 'S'
          : same(state.end, cell)
            ? 'E'
            : waypoint
              ? String(map.waypoints.indexOf(waypoint) + 1)
              : '';
        ctx.fillText(label, (x + 0.5) * size, (y + 0.5) * size);
      }
    }
};
