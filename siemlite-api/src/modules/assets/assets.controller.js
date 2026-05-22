const service = require('./assets.service');
const { success } = require('../../utils/apiResponse');

const wrap = (fn) => async (req, res, next) => {
  try {
    return await fn(req, res, next);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  list: wrap(async (req, res) => {
    const result = await service.list(req.query);
    return success(res, result.assets, 'Assets retrieved', 200, result.pagination);
  }),
  getById: wrap(async (req, res) => {
    const data = await service.getById(req.params.id);
    return success(res, data, 'Asset retrieved');
  }),
  create: wrap(async (req, res) => {
    const data = await service.create(req.body);
    return success(res, data, 'Asset created', 201);
  }),
  update: wrap(async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    return success(res, data, 'Asset updated');
  }),
  deactivate: wrap(async (req, res) => {
    const data = await service.deactivate(req.params.id);
    return success(res, data, 'Asset deactivated');
  }),
  getIncidents: wrap(async (req, res) => {
    const data = await service.getIncidents(req.params.id);
    return success(res, data, 'Asset incident history retrieved');
  }),
};
