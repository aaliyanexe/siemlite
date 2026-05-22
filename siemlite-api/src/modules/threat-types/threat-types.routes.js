const { Router } = require('express');
const controller = require('./threat-types.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const { validate } = require('../../middleware/validate');
const { createSchema, updateSchema, idSchema, listSchema } = require('./threat-types.schemas');

const router = Router();

router.use(authenticate);

router.get('/', validate(listSchema), controller.list);
router.post('/', requireRole('Admin'), validate(createSchema), controller.create);
router.put('/:id', requireRole('Admin'), validate(updateSchema), controller.update);
router.patch('/:id/deactivate', requireRole('Admin'), validate(idSchema), controller.deactivate);

module.exports = router;
