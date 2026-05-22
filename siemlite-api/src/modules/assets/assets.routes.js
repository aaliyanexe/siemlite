const { Router } = require('express');
const controller = require('./assets.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const { validate } = require('../../middleware/validate');
const { createSchema, updateSchema, idSchema, listSchema } = require('./assets.schemas');

const router = Router();

router.use(authenticate);

router.get('/', validate(listSchema), controller.list);
router.post('/', requireRole('Admin'), validate(createSchema), controller.create);
router.get('/:id', validate(idSchema), controller.getById);
router.put('/:id', requireRole('Admin'), validate(updateSchema), controller.update);
router.get('/:id/incidents', validate(idSchema), controller.getIncidents);
router.patch('/:id/deactivate', requireRole('Admin'), validate(idSchema), controller.deactivate);

module.exports = router;
