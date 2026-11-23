import { Worker } from 'node:worker_threads';
import { memoize, solve } from '../../domain/pathfinding/bfs.js';

export const createSearch = (maxActive = 2) => {
  const cachedSolve = memoize(solve);
  let active = 0;
  return async (...args) => {
    // Small searches benefit from avoiding worker startup and from bounded memoization.
    if (args[0].width * args[0].height < 2500) return cachedSolve(...args);
    if (active >= maxActive) {
      const error = new Error('Search capacity reached; retry shortly');
      error.status = 503;
      throw error;
    }
    active += 1;
    try {
      return await new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./search-worker.js', import.meta.url), {
          workerData: args,
        });
        const timer = setTimeout(() => {
          worker.terminate();
          reject(new Error('Search timed out'));
        }, 10000);
        worker.once('message', (message) => {
          if (message.error)
            reject(Object.assign(new Error(message.error), { status: message.status }));
          else resolve(message.value);
        });
        worker.once('error', reject);
        worker.once('exit', (code) => {
          clearTimeout(timer);
          if (code !== 0) reject(new Error('Search worker stopped'));
        });
      });
    } finally {
      active -= 1;
    }
  };
};
