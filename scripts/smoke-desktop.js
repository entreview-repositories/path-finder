import { app } from 'electron';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = mkdtempSync(join(tmpdir(), 'path-finder-ui-'));
process.env.DATABASE_URL = `file:${join(directory, 'ui.db')}`;
const setup = spawnSync(
  'node',
  [
    '--input-type=module',
    '-e',
    "import {DatabaseSync} from 'node:sqlite'; import {readFileSync} from 'node:fs'; const db=new DatabaseSync(process.argv[1]); db.exec(readFileSync('prisma/migrations/202611120001_initial/migration.sql','utf8')); db.close();",
    join(directory, 'ui.db'),
  ],
  { env: process.env, stdio: 'inherit' },
);
if (setup.status !== 0) process.exit(1);
const timeout = setTimeout(() => {
  console.error('Desktop smoke test timed out');
  app.exit(1);
}, 30000);
app.once('browser-window-created', (_event, window) => {
  window.webContents.once('did-finish-load', async () => {
    try {
      const result = await window.webContents.executeJavaScript(`(async () => {
        const waitFor = async (predicate) => {
          const deadline = Date.now() + 15000;
          while (!predicate()) {
            if (Date.now() > deadline) throw new Error(document.getElementById('notice').textContent);
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
        };
        const byId = (id) => document.getElementById(id);
        await waitFor(() => !byId('demo').disabled);
        byId('demo').click();
        await waitFor(() => byId('notice').textContent.startsWith('Sample ready'));
        byId('solve').click();
        await waitFor(() => byId('notice').textContent.startsWith('Shortest route saved'));
        const stats = byId('stats').textContent;
        if (!stats.includes('18 steps')) throw new Error('Unexpected route: ' + stats);
        const routeId = byId('routes').value;
        const response = await fetch('/api/routes/' + routeId);
        const route = await response.json();
        if (route.path.length !== 19) throw new Error('Incorrect saved path');
        const stopIndex = route.path.findIndex((cell) => cell.x === 7 && cell.y === 6);
        if (stopIndex < 0) throw new Error('Waypoint not visited');
        byId('routes').dispatchEvent(new Event('change'));
        await waitFor(() => !byId('routes').disabled);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return { title: document.title, stats, routeId, waypointVisited: true };
      })()`);
      const screenshot = await window.webContents.capturePage();
      writeFileSync(
        process.env.SCREENSHOT_PATH ?? '/tmp/path-finder-desktop.png',
        screenshot.toPNG(),
      );
      console.log('DESKTOP_SMOKE_OK', JSON.stringify(result));
      clearTimeout(timeout);
      window.close();
    } catch (error) {
      console.error(error);
      clearTimeout(timeout);
      app.exit(1);
    }
  });
});
app.on('will-quit', () => {
  rmSync(directory, { recursive: true, force: true });
});
await import('../desktop.js');
