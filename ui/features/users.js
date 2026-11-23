export const bindUsers = ({
  $,
  state,
  api,
  notice,
  run,
  refreshUsers,
  refreshMaps,
  loadMap,
  requireUser,
  userData,
  action,
}) => {
  action('new-user', async () => {
    const user = await api('users', 'POST', userData());
    await refreshUsers();
    $('users').value = user.id;
    await refreshMaps();
    await loadMap(null);
    notice('User created.');
  });
  action('save-user', async () => {
    await api(`users/${requireUser()}`, 'PATCH', userData());
    await refreshUsers();
    notice('User updated.');
  });
  action('delete-user', async () => {
    if (!confirm('Delete this user and all their maps?')) return;
    await api(`users/${requireUser()}`, 'DELETE');
    await refreshUsers();
    await refreshMaps();
    await loadMap(null);
    notice('User and associated maps deleted.');
  });
  action('save-preferences', async () => {
    await api(`users/${requireUser()}`, 'PATCH', {
      preferences: { avoidCells: JSON.parse($('avoid').value) },
    });
    await refreshUsers();
    if (state.map) await loadMap(state.map.id, false);
    notice('Preferences saved. Existing routes were invalidated.');
  });
  $('users').addEventListener('change', () =>
    run(async () => {
      const user = state.users.find((item) => item.id === Number($('users').value));
      if (user) {
        $('username').value = user.name;
        $('email').value = user.email;
        $('avoid').value = JSON.stringify(user.preferences.avoidCells ?? []);
      }
      await refreshMaps();
      await loadMap(null);
    }),
  );
};
