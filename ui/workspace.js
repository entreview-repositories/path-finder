import { api } from './services/api.js';
import { createEditorState } from './state/editor.store.js';
import { drawMap } from './views/map-canvas.js';

export const createWorkspace = () => {
  const state = createEditorState();
  const $ = (id) => document.getElementById(id);
  const notice = (message, error = false) => {
    $('notice').textContent = message;
    $('notice').className = error ? 'error' : '';
  };
  const run = async (operation) => {
    if (state.busy) return;
    state.busy = true;
    document.querySelectorAll('button,input,select,textarea').forEach((element) => {
      element.disabled = true;
    });
    try {
      await operation();
    } catch (error) {
      notice(error.message, true);
    } finally {
      state.busy = false;
      document.querySelectorAll('button,input,select,textarea').forEach((element) => {
        element.disabled = false;
      });
    }
  };
  const options = (element, rows, label) => {
    const previous = element.value;
    element.replaceChildren(
      new Option(`Select ${label}`, ''),
      ...rows.map(
        (row) => new Option(`${row.id} · ${row.name ?? `${row.distance} steps`}`, row.id),
      ),
    );
    if (rows.some((row) => String(row.id) === previous)) element.value = previous;
  };
  const refreshUsers = async () => {
    state.users = await api('users');
    options($('users'), state.users, 'a user');
  };
  const refreshMaps = async () => {
    state.maps = (await api('maps')).filter((map) => map.userId === Number($('users').value));
    options($('maps'), state.maps, 'a map');
  };
  const refreshRoutes = async () =>
    options($('routes'), state.map ? await api(`routes?mapId=${state.map.id}`) : [], 'a route');
  const draw = () => drawMap($('grid'), state);
  const loadMap = async (mapId, reset = true) => {
    state.map = mapId ? await api(`maps/${mapId}`) : null;
    state.path = [];
    $('stats').textContent = '';
    if (reset) {
      state.start = null;
      state.end = null;
    }
    if (state.map) {
      $('maps').value = state.map.id;
      $('mapname').value = state.map.name;
      $('width').value = state.map.width;
      $('height').value = state.map.height;
    }
    await refreshRoutes();
    draw();
  };
  const requireMap = () => {
    if (!state.map) throw new Error('Select or create a map first');
    return state.map;
  };
  const requireUser = () => {
    const id = Number($('users').value);
    if (!id) throw new Error('Select or create a user first');
    return id;
  };
  const userData = () => ({ name: $('username').value, email: $('email').value });
  const mapData = () => ({
    name: $('mapname').value,
    width: Number($('width').value),
    height: Number($('height').value),
    userId: requireUser(),
  });
  const action = (element, operation) => {
    $(element).addEventListener('click', () => run(operation));
  };
  return {
    $,
    state,
    api,
    notice,
    run,
    refreshUsers,
    refreshMaps,
    refreshRoutes,
    draw,
    loadMap,
    requireMap,
    requireUser,
    userData,
    mapData,
    action,
  };
};
