import { prepareUser } from './policies/user.policy.js';
import { createMapPolicy } from './policies/map.policy.js';
import { createCellPolicies } from './policies/cell.policy.js';
import { createRoutePolicy } from './policies/route.policy.js';

export const createResourcePolicies = (dependencies) => ({
  user: prepareUser,
  map: createMapPolicy(dependencies),
  ...createCellPolicies(dependencies),
  route: createRoutePolicy(dependencies),
});
