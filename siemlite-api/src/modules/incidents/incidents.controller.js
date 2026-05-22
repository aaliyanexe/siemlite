const incidentsService = require('./incidents.service');
const { success } = require('../../utils/apiResponse');

async function list(req, res, next) {
  try {
    const result = await incidentsService.listIncidents(req.query);
    return success(res, result.incidents, 'Incidents retrieved', 200, result.pagination);
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const incident = await incidentsService.getIncident(req.params.id);
    return success(res, incident, 'Incident retrieved');
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const incident = await incidentsService.createIncident(req.body, req.user.userId);
    return success(res, incident, 'Incident created', 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const incident = await incidentsService.updateIncident(
      req.params.id,
      req.body,
      req.user.userId,
      req.user.role
    );
    return success(res, incident, 'Incident updated');
  } catch (err) {
    return next(err);
  }
}

async function assign(req, res, next) {
  try {
    const incident = await incidentsService.assignIncident(
      req.params.id,
      req.body.assigned_analyst_id,
      req.user.userId,
      req.user.role
    );
    return success(res, incident, 'Incident assigned');
  } catch (err) {
    return next(err);
  }
}

async function changeStatus(req, res, next) {
  try {
    const incident = await incidentsService.changeStatus(
      req.params.id,
      req.body.status,
      req.user.userId,
      req.user.role
    );
    return success(res, incident, 'Status updated');
  } catch (err) {
    return next(err);
  }
}

async function resolve(req, res, next) {
  try {
    const incident = await incidentsService.resolveIncident(
      req.params.id,
      req.body.resolution_summary,
      req.user.userId,
      req.user.role
    );
    return success(res, incident, 'Incident resolved');
  } catch (err) {
    return next(err);
  }
}

async function reopen(req, res, next) {
  try {
    const incident = await incidentsService.reopenIncident(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    return success(res, incident, 'Incident reopened');
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await incidentsService.deleteIncident(req.params.id, req.user.userId);
    return success(res, null, 'Incident deleted');
  } catch (err) {
    return next(err);
  }
}

async function timeline(req, res, next) {
  try {
    const entries = await incidentsService.getTimeline(req.params.id);
    return success(res, entries, 'Timeline retrieved');
  } catch (err) {
    return next(err);
  }
}

async function logs(req, res, next) {
  try {
    const entries = await incidentsService.getLogs(req.params.id);
    return success(res, entries, 'Incident logs retrieved');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  assign,
  changeStatus,
  resolve,
  reopen,
  remove,
  timeline,
  logs,
};
