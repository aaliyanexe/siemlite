const { Router } = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const { validate } = require('../../middleware/validate');
const {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  listUsersSchema,
  resetPasswordSchema,
} = require('./users.schemas');

const router = Router();

router.use(authenticate);

router.get('/me', usersController.getMe);

router.get('/', requireRole('Admin'), validate(listUsersSchema), usersController.list);
router.post('/', requireRole('Admin'), validate(createUserSchema), usersController.create);
router.get('/:id', requireRole('Admin'), validate(userIdSchema), usersController.getById);
router.put('/:id', requireRole('Admin'), validate(updateUserSchema), usersController.update);
router.patch(
  '/:id/deactivate',
  requireRole('Admin'),
  validate(userIdSchema),
  usersController.deactivate
);
router.patch(
  '/:id/reset-password',
  requireRole('Admin'),
  validate(resetPasswordSchema),
  usersController.resetPassword
);

module.exports = router;
