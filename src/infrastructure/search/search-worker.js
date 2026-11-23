import { parentPort, workerData } from 'node:worker_threads';
import { solve } from '../../domain/pathfinding/bfs.js';

try {
  parentPort.postMessage({ value: solve(...workerData) });
} catch (error) {
  parentPort.postMessage({ error: error.message, status: error.status ?? 500 });
}
