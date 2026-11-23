export const createResourceController = (service, entity, filterByMap) => ({
  list: async (req, res) =>
    res.json(await service.list(entity, filterByMap ? req.query.mapId : undefined)),
  show: async (req, res) => res.json(await service.get(entity, req.params.id)),
  create: async (req, res) => res.status(201).json(await service.create(entity, req.body)),
  update: async (req, res) => res.json(await service.update(entity, req.params.id, req.body)),
  remove: async (req, res) => {
    await service.remove(entity, req.params.id);
    res.status(204).end();
  },
});
