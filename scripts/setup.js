import { mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

mkdirSync('data', { recursive: true });
for (const args of [['generate'], ['migrate', 'deploy']]) {
  const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], {
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync('node_modules/electron/path.txt')) {
  const install = spawnSync(process.execPath, ['node_modules/electron/install.js'], {
    stdio: 'inherit',
  });
  if (install.status !== 0) process.exit(install.status ?? 1);
}
