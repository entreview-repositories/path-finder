export const bindRoutes = ({
  $,
  state,
  api,
  notice,
  run,
  refreshRoutes,
  draw,
  requireMap,
  action,
}) => {
  action('solve', async () => {
    const map = requireMap();
    if (!state.start || !state.end) throw new Error('Set a start and a destination');
    const route = await api('routes', 'POST', {
      mapId: map.id,
      start: state.start,
      end: state.end,
    });
    state.path = route.path;
    draw();
    await refreshRoutes();
    $('routes').value = route.id;
    $('stats').textContent =
      `${route.distance} steps · ${route.visitedCount} visited nodes across segments · Route #${route.id}`;
    notice('Shortest route saved, visiting waypoints in their numbered order.');
  });
  $('routes').addEventListener('change', () =>
    run(async () => {
      if (!$('routes').value) return;
      const route = await api(`routes/${$('routes').value}`);
      state.path = route.path;
      state.start = { x: route.startX, y: route.startY };
      state.end = { x: route.endX, y: route.endY };
      draw();
      $('stats').textContent = `${route.distance} steps · Route #${route.id}`;
    }),
  );
  action('delete-route', async () => {
    if (!$('routes').value) throw new Error('Select a route');
    await api(`routes/${$('routes').value}`, 'DELETE');
    state.path = [];
    draw();
    await refreshRoutes();
    $('stats').textContent = '';
    notice('Route deleted.');
  });
};
