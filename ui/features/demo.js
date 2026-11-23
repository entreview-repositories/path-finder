export const bindDemo = ({
  $,
  state,
  api,
  notice,
  refreshUsers,
  refreshMaps,
  draw,
  loadMap,
  action,
}) => {
  action('demo', async () => {
    let user = state.users.find((item) => item.email === 'demo@example.com');
    if (!user)
      user = await api('users', 'POST', { name: 'Demo student', email: 'demo@example.com' });
    await refreshUsers();
    $('users').value = user.id;
    const map = await api('maps', 'POST', {
      name: 'BFS sample',
      width: 10,
      height: 10,
      userId: user.id,
    });
    // Sequential writes avoid competing SQLite write transactions.
    for (const y of [0, 1, 2, 3, 5, 6, 7])
      await api('obstacles', 'POST', { mapId: map.id, x: 4, y });
    await api('waypoints', 'POST', { mapId: map.id, x: 7, y: 6, name: 'Checkpoint', position: 0 });
    await refreshMaps();
    await loadMap(map.id);
    state.start = { x: 0, y: 0 };
    state.end = { x: 9, y: 9 };
    draw();
    notice('Sample ready. Click Find and save shortest route.');
  });
};
