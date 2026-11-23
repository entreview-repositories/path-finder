import { app, BrowserWindow, dialog } from 'electron';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Keep native SQLite bindings in system Node, independent of Electron's ABI.
let backend;
let quitting = false;
app.whenReady().then(() => {
  backend = spawn(process.env.NODE_BINARY ?? 'node', ['app.js'], {
    cwd: fileURLToPath(new URL('.', import.meta.url)),
    env: { ...process.env, PORT: '0', ELECTRON_RUN_AS_NODE: undefined },
    stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
  });
  backend.on('error', (error) => {
    dialog.showErrorBox('Backend failed', error.message);
    app.quit();
  });
  backend.on('exit', (code) => {
    if (!quitting) {
      dialog.showErrorBox(
        'Backend stopped',
        `Node exited with code ${code}. Run npm run setup and retry.`,
      );
      app.quit();
    }
  });
  backend.once('message', ({ address }) => {
    const window = new BrowserWindow({
      width: 1180,
      height: 820,
      minWidth: 860,
      minHeight: 650,
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    });
    window.setMenuBarVisibility(false);
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith(`${address}/`)) event.preventDefault();
    });
    window.loadURL(address);
  });
});
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => {
  quitting = true;
  backend?.kill('SIGTERM');
});
