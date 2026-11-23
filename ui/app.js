import { createWorkspace } from './workspace.js';
import { bindUsers } from './features/users.js';
import { bindMaps } from './features/maps.js';
import { bindEditor } from './features/editor.js';
import { bindRoutes } from './features/routes.js';
import { bindDemo } from './features/demo.js';

const workspace = createWorkspace();
bindUsers(workspace);
bindMaps(workspace);
bindEditor(workspace);
bindRoutes(workspace);
bindDemo(workspace);
await workspace.run(async () => {
  await workspace.refreshUsers();
  workspace.draw();
});
