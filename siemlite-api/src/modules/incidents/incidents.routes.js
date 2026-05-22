const { Router } = require('express');
const incidentsController = require('./incidents.controller');
const responseController = require('../response-actions/response-actions.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const { validate } = require('../../middleware/validate');
const {
  createIncidentSchema,
  updateIncidentSchema,
  incidentIdSchema,
  listIncidentsSchema,
  assignSchema,
  statusSchema,
  resolveSchema,
} = require('./incidents.schemas');
const {
  createResponseSchema,
  updateResponseSchema,
  responseIdSchema,
} = require('../response-actions/response-actions.schemas');

const router = Router();

router.use(authenticate);

router.get('/', validate(listIncidentsSchema), incidentsController.list);
router.post('/', validate(createIncidentSchema), incidentsController.create);
router.get('/:id', validate(incidentIdSchema), incidentsController.getById);
router.put('/:id', validate(updateIncidentSchema), incidentsController.update);
router.patch('/:id/assign', validate(assignSchema), incidentsController.assign);
router.patch('/:id/status', validate(statusSchema), incidentsController.changeStatus);
router.patch('/:id/resolve', validate(resolveSchema), incidentsController.resolve);
router.patch('/:id/reopen', requireRole('Admin'), validate(incidentIdSchema), incidentsController.reopen);
router.delete('/:id', requireRole('Admin'), validate(incidentIdSchema), incidentsController.remove);

router.get('/:id/timeline', validate(incidentIdSchema), incidentsController.timeline);
router.get('/:id/logs', validate(incidentIdSchema), incidentsController.logs);

router.get('/:id/responses', validate(incidentIdSchema), responseController.list);
router.post('/:id/responses', validate(createResponseSchema), responseController.create);
router.put(
  '/:id/responses/:rid',
  validate(updateResponseSchema),
  responseController.update
);
router.delete(
  '/:id/responses/:rid',
  requireRole('Admin'),
  validate(responseIdSchema),
  responseController.remove
);

module.exports = router;
