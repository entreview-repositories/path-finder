import { same } from '../state/editor.store.js';

export const bindEditor = ({ $, state, api, notice, run, draw, loadMap, requireMap }) => {
  $('tools').addEventListener('click', (event) => {
    const mode = event.target.dataset.mode;
    if (!mode || state.busy) return;
    state.mode = mode;
    document
      .querySelectorAll('[data-mode]')
      .forEach((button) => button.classList.toggle('selected', button.dataset.mode === mode));
  });
  $('grid').addEventListener('click', (event) =>
    run(async () => {
      const map = requireMap();
      const bounds = $('grid').getBoundingClientRect();
      const cell = {
        x: Math.floor(((event.clientX - bounds.left) / bounds.width) * map.width),
        y: Math.floor(((event.clientY - bounds.top) / bounds.height) * map.height),
      };
      const obstacle = map.obstacles.find((item) => same(item, cell));
      if (state.mode === 'start' || state.mode === 'end') {
        if (obstacle) throw new Error('This cell contains an obstacle');
        state[state.mode] = cell;
        state.path = [];
        $('stats').textContent = '';
        draw();
        notice(`${state.mode}: (${cell.x}, ${cell.y})`);
        return;
      }
      if (state.mode === 'obstacle') {
        if (same(state.start, cell) || same(state.end, cell))
          throw new Error('Move the start or destination first');
        await api('obstacles', 'POST', { mapId: map.id, ...cell });
      }
      if (state.mode === 'waypoint')
        await api('waypoints', 'POST', {
          mapId: map.id,
          ...cell,
          name: `Stop ${map.waypoints.length + 1}`,
          position: Math.max(-1, ...map.waypoints.map((item) => item.position)) + 1,
        });
      if (state.mode === 'erase') {
        const waypoint = map.waypoints.find((item) => same(item, cell));
        if (obstacle) await api(`obstacles/${obstacle.id}`, 'DELETE');
        if (waypoint) await api(`waypoints/${waypoint.id}`, 'DELETE');
        if (same(state.start, cell)) state.start = null;
        if (same(state.end, cell)) state.end = null;
      }
      await loadMap(map.id, false);
      notice('Map saved.');
    }),
  );
};
