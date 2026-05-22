const { Router } = require('express');
const controller = require('./logs.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const { validate } = require('../../middleware/validate');
const { listLogsSchema } = require('./logs.schemas');

const router = Router();

router.use(authenticate, requireRole('Admin'));
router.get('/', validate(listLogsSchema), controller.list);

module.exports = router;
