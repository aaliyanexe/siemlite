const service = require('./threat-types.service');
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
    const data = await service.list(req.query);
    return success(res, data, 'Threat types retrieved');
  }),
  create: wrap(async (req, res) => {
    const data = await service.create(req.body);
    return success(res, data, 'Threat type created', 201);
  }),
  update: wrap(async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    return success(res, data, 'Threat type updated');
  }),
  deactivate: wrap(async (req, res) => {
    const data = await service.deactivate(req.params.id);
    return success(res, data, 'Threat type deactivated');
  }),
};
