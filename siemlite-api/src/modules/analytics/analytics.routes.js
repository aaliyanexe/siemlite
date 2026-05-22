const { Router } = require('express');
const controller = require('./analytics.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const { validate } = require('../../middleware/validate');
const { dateRangeSchema } = require('./analytics.schemas');

const router = Router();

router.use(authenticate);

router.get('/threat-frequency', validate(dateRangeSchema), controller.threatFrequency);
router.get('/analyst-workload', controller.analystWorkload);
router.get('/asset-exposure', controller.assetExposure);
router.get('/sla-compliance', controller.slaCompliance);
router.get('/incident-trends', validate(dateRangeSchema), controller.incidentTrends);
router.get('/dashboard/admin', requireRole('Admin'), controller.adminDashboard);
router.get('/dashboard/analyst', controller.analystDashboard);

module.exports = router;
