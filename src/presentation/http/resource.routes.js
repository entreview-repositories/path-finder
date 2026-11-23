import { Router } from 'express';
import { validateBody, validateId, validateMapFilter } from './middleware/request.js';
import { createResourceController } from './resource.controller.js';

const resources = [
  ['users', 'user', false],
  ['maps', 'map', false],
  ['obstacles', 'obstacle', true],
  ['waypoints', 'waypoint', true],
  ['routes', 'route', true],
];
export const createResourceRoutes = (service) => {
  const router = Router();
  router.param('id', validateId);
  for (const [path, entity, filterByMap] of resources) {
    const controller = createResourceController(service, entity, filterByMap);
    router.get(`/${path}`, ...(filterByMap ? [validateMapFilter] : []), controller.list);
    router.post(`/${path}`, validateBody, controller.create);
    router.get(`/${path}/:id`, controller.show);
    router.put(`/${path}/:id`, validateBody, controller.update);
    router.patch(`/${path}/:id`, validateBody, controller.update);
    router.delete(`/${path}/:id`, controller.remove);
  }
  return router;
};
