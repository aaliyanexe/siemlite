const service = require('./logs.service');
const { success } = require('../../utils/apiResponse');

module.exports = {
  list: async (req, res, next) => {
    try {
      const result = await service.listSystemLogs(req.query);
      return success(res, result.logs, 'Audit logs retrieved', 200, result.pagination);
    } catch (err) {
      return next(err);
    }
  },
};
