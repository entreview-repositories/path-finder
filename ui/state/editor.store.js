export const createEditorState = () => ({
  users: [],
  maps: [],
  map: null,
  start: null,
  end: null,
  path: [],
  mode: 'start',
  busy: false,
});
export const same = (a, b) => a && b && a.x === b.x && a.y === b.y;
