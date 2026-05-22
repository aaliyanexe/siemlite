const { Router } = require('express');
const authController = require('./auth.controller');
const { validate } = require('../../middleware/validate');
const { loginSchema, changePasswordSchema } = require('./auth.schemas');
const { authenticate } = require('../../middleware/auth');

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;
