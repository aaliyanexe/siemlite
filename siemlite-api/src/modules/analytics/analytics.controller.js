const service = require('./analytics.service');
const { success } = require('../../utils/apiResponse');

const wrap = (fn) => async (req, res, next) => {
  try {
    return await fn(req, res, next);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  threatFrequency: wrap(async (req, res) => {
    const data = await service.threatFrequency(req.query);
    return success(res, data, 'Threat frequency report');
  }),
  analystWorkload: wrap(async (req, res) => {
    const data = await service.analystWorkload();
    return success(res, data, 'Analyst workload report');
  }),
  assetExposure: wrap(async (req, res) => {
    const data = await service.assetExposure();
    return success(res, data, 'Asset exposure report');
  }),
  slaCompliance: wrap(async (req, res) => {
    const data = await service.slaCompliance();
    return success(res, data, 'SLA compliance report');
  }),
  incidentTrends: wrap(async (req, res) => {
    const data = await service.incidentTrends(req.query);
    return success(res, data, 'Incident trends report');
  }),
  adminDashboard: wrap(async (req, res) => {
    const data = await service.adminDashboard();
    return success(res, data, 'Admin dashboard');
  }),
  analystDashboard: wrap(async (req, res) => {
    const data = await service.analystDashboard(req.user.userId);
    return success(res, data, 'Analyst dashboard');
  }),
};
