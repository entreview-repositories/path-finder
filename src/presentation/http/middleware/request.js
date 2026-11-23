import { fail } from '../../../domain/result.js';
import { id, object } from '../../../domain/validation.js';

export const validateBody = (req, _res, next) => {
  if (!req.is('application/json')) fail(415, 'Use Content-Type application/json');
  object(req.body);
  next();
};
export const validateId = (_req, _res, next, value) => {
  id(value);
  next();
};
export const validateMapFilter = (req, _res, next) => {
  if (req.query.mapId !== undefined) id(req.query.mapId);
  next();
};
export const notFound = (_req, res) => res.status(404).json({ error: 'Endpoint not found' });
