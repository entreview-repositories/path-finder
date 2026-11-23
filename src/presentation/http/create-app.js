import express from 'express';
import { fileURLToPath } from 'node:url';
import { createService } from '../../application/create-service.js';
import { createSearch } from '../../infrastructure/search/worker-search.js';
import { createResourceRoutes } from './resource.routes.js';
import { notFound } from './middleware/request.js';
import { errorHandler } from './middleware/error-handler.js';

export const createApp = (repository, { search = createSearch(), logger = console.error } = {}) => {
  const app = express();
  const service = createService(repository, search);
  app.use(express.static(fileURLToPath(new URL('../../../ui', import.meta.url))));
  app.use(express.json({ limit: '256kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', createResourceRoutes(service));
  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
};
