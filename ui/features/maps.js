export const bindMaps = ({
  $,
  state,
  api,
  notice,
  run,
  refreshMaps,
  loadMap,
  requireMap,
  mapData,
  action,
}) => {
  $('maps').addEventListener('change', () =>
    run(async () => {
      await loadMap($('maps').value);
      notice('Map loaded. Set a start and a destination.');
    }),
  );
  action('new-map', async () => {
    const map = await api('maps', 'POST', mapData());
    await refreshMaps();
    await loadMap(map.id);
    notice('Map created. Add a waypoint before searching.');
  });
  action('save-map', async () => {
    await api(`maps/${requireMap().id}`, 'PATCH', mapData());
    await loadMap(state.map.id);
    await refreshMaps();
    notice('Map updated.');
  });
  action('delete-map', async () => {
    if (!confirm('Delete this map and its routes?')) return;
    await api(`maps/${requireMap().id}`, 'DELETE');
    await refreshMaps();
    await loadMap(null);
    notice('Map deleted.');
  });
};
