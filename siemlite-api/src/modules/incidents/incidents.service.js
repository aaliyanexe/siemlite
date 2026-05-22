const incidentsRepo = require('./incidents.repository');
const logsRepo = require('../logs/logs.repository');
const responseRepo = require('../response-actions/response-actions.repository');
const { withTransaction } = require('../../config/db');
const { calculateSlaDeadline } = require('../../utils/sla');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { AppError } = require('../../middleware/errorHandler');

const TRANSITIONS = {
  Open: ['Investigating'],
  Investigating: ['Resolved'],
  Resolved: ['Reopened'],
  Reopened: ['Investigating', 'Resolved'],
};

function canTransition(from, to) {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

async function getIncidentOrThrow(incidentId, includeDeleted = false) {
  const incident = await incidentsRepo.findById(incidentId, includeDeleted);
  if (!incident) {
    throw new AppError('INCIDENT_NOT_FOUND', `Incident with id ${incidentId} does not exist`, 404);
  }
  return incident;
}

function assertCanModify(incident, userId, role) {
  if (role === 'Admin') return;
  if (incident.assigned_analyst_id !== userId) {
    throw new AppError('FORBIDDEN', 'Only the assigned analyst or Admin can modify this incident', 403);
  }
}

async function listIncidents(query) {
  await incidentsRepo.refreshSlaBreachedFlags();
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await incidentsRepo.findAll(
    {
      status: query.status,
      severity: query.severity,
      threat_type_id: query.threat_type_id,
      asset_id: query.asset_id,
      assigned_analyst_id: query.assigned_analyst_id,
      date_from: query.date_from,
      date_to: query.date_to,
      sla_breached: query.sla_breached,
      search: query.search,
    },
    limit,
    offset,
    query.sort || 'date_reported',
    query.order || 'desc'
  );
  return {
    incidents: rows,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getIncident(incidentId) {
  await incidentsRepo.refreshSlaBreachedFlags();
  return getIncidentOrThrow(incidentId);
}

async function createIncident(data, reportedBy) {
  if (!(await incidentsRepo.isThreatTypeActive(data.threat_type_id))) {
    throw new AppError('THREAT_TYPE_INACTIVE', 'Threat type is not available', 400);
  }
  if (!(await incidentsRepo.isAssetActive(data.asset_id))) {
    throw new AppError('ASSET_INACTIVE', 'Asset is not available for new incidents', 400);
  }

  const slaDeadline = calculateSlaDeadline(data.severity);

  const incidentId = await withTransaction(async (client) => {
    const id = await incidentsRepo.create(client, {
      title: data.title,
      description: data.description,
      severity: data.severity,
      slaDeadline,
      reportedBy,
      threatTypeId: data.threat_type_id,
      assetId: data.asset_id,
    });

    await logsRepo.insertLog(client, {
      incidentId: id,
      actorId: reportedBy,
      actionType: 'INCIDENT_CREATED',
      newValue: data.title,
    });

    return id;
  });

  return getIncident(incidentId);
}

async function updateIncident(incidentId, data, userId, role) {
  const incident = await getIncidentOrThrow(incidentId);
  assertCanModify(incident, userId, role);

  const updates = {};
  const logs = [];

  if (data.description !== undefined && data.description !== incident.description) {
    updates.description = data.description;
  }

  if (data.severity && data.severity !== incident.severity) {
    updates.severity = data.severity;
    updates.sla_deadline = calculateSlaDeadline(data.severity, incident.date_reported);
    logs.push({
      actionType: 'SEVERITY_CHANGED',
      oldValue: incident.severity,
      newValue: data.severity,
    });
  }

  if (data.threat_type_id && data.threat_type_id !== incident.threat_type_id) {
    if (!(await incidentsRepo.isThreatTypeActive(data.threat_type_id))) {
      throw new AppError('THREAT_TYPE_INACTIVE', 'Threat type is not available', 400);
    }
    updates.threat_type_id = data.threat_type_id;
  }

  if (data.asset_id && data.asset_id !== incident.asset_id) {
    if (!(await incidentsRepo.isAssetActive(data.asset_id))) {
      throw new AppError('ASSET_INACTIVE', 'Asset is not available', 400);
    }
    updates.asset_id = data.asset_id;
  }

  if (data.assigned_analyst_id !== undefined) {
    if (data.assigned_analyst_id !== null) {
      if (!(await incidentsRepo.isActiveAnalyst(data.assigned_analyst_id))) {
        throw new AppError('INVALID_ANALYST', 'Assigned user must be an active Analyst', 400);
      }
    }
    const oldAnalyst = incident.assigned_analyst_id
      ? String(incident.analyst_name || incident.assigned_analyst_id)
      : null;
    updates.assigned_analyst_id = data.assigned_analyst_id;

    if (data.assigned_analyst_id && incident.status === 'Open') {
      updates.status = 'Investigating';
      logs.push({
        actionType: 'STATUS_CHANGED',
        oldValue: 'Open',
        newValue: 'Investigating',
      });
    }

    logs.push({
      actionType: 'ANALYST_ASSIGNED',
      oldValue: oldAnalyst,
      newValue: data.assigned_analyst_id ? String(data.assigned_analyst_id) : 'Unassigned',
    });
  }

  if (Object.keys(updates).length === 0) {
    return incident;
  }

  await withTransaction(async (client) => {
    await incidentsRepo.update(client, incidentId, updates);
    for (const log of logs) {
      await logsRepo.insertLog(client, {
        incidentId,
        actorId: userId,
        ...log,
      });
    }
  });

  return getIncident(incidentId);
}

async function assignIncident(incidentId, analystId, userId, role) {
  const incident = await getIncidentOrThrow(incidentId);

  let targetAnalystId = analystId;

  if (role === 'Analyst') {
    if (incident.assigned_analyst_id && incident.assigned_analyst_id !== userId) {
      throw new AppError('FORBIDDEN', 'Incident is already assigned to another analyst', 403);
    }
    targetAnalystId = userId;
  } else if (role === 'Admin') {
    if (!targetAnalystId) {
      throw new AppError('VALIDATION_ERROR', 'assigned_analyst_id is required for Admin assignment', 400);
    }
  }

  if (!(await incidentsRepo.isActiveAnalyst(targetAnalystId))) {
    throw new AppError('INVALID_ANALYST', 'Assigned user must be an active Analyst', 400);
  }

  const updates = { assigned_analyst_id: targetAnalystId };
  const logs = [
    {
      actionType: 'ANALYST_ASSIGNED',
      oldValue: incident.analyst_name || (incident.assigned_analyst_id ? String(incident.assigned_analyst_id) : null),
      newValue: String(targetAnalystId),
    },
  ];

  if (incident.status === 'Open') {
    updates.status = 'Investigating';
    logs.push({ actionType: 'STATUS_CHANGED', oldValue: 'Open', newValue: 'Investigating' });
  }

  await withTransaction(async (client) => {
    await incidentsRepo.update(client, incidentId, updates);
    for (const log of logs) {
      await logsRepo.insertLog(client, { incidentId, actorId: userId, ...log });
    }
  });

  return getIncident(incidentId);
}

async function changeStatus(incidentId, newStatus, userId, role) {
  const incident = await getIncidentOrThrow(incidentId);

  if (newStatus === 'Reopened' && role !== 'Admin') {
    throw new AppError('FORBIDDEN', 'Only Admin can reopen incidents', 403);
  }

  if (newStatus !== 'Reopened') {
    assertCanModify(incident, userId, role);
  }

  if (!canTransition(incident.status, newStatus)) {
    throw new AppError(
      'INVALID_STATUS_TRANSITION',
      `Cannot transition from ${incident.status} to ${newStatus}`,
      400
    );
  }

  if (newStatus === 'Investigating' && !incident.assigned_analyst_id) {
    throw new AppError('ANALYST_REQUIRED', 'An analyst must be assigned before investigating', 400);
  }

  if (newStatus === 'Resolved') {
    const count = await incidentsRepo.countResponseActions(incidentId);
    if (count < 1) {
      throw new AppError(
        'RESPONSE_REQUIRED',
        'At least one response action is required before resolving',
        400
      );
    }
    throw new AppError(
      'USE_RESOLVE_ENDPOINT',
      'Use PATCH /incidents/:id/resolve with resolution_summary to resolve',
      400
    );
  }

  await withTransaction(async (client) => {
    await incidentsRepo.update(client, incidentId, { status: newStatus });
    await logsRepo.insertLog(client, {
      incidentId,
      actorId: userId,
      actionType: 'STATUS_CHANGED',
      oldValue: incident.status,
      newValue: newStatus,
    });
  });

  return getIncident(incidentId);
}

async function resolveIncident(incidentId, resolutionSummary, userId, role) {
  const incident = await getIncidentOrThrow(incidentId);
  assertCanModify(incident, userId, role);

  if (!['Investigating', 'Reopened'].includes(incident.status)) {
    throw new AppError(
      'INVALID_STATUS',
      'Incident must be Investigating or Reopened to resolve',
      400
    );
  }

  const count = await incidentsRepo.countResponseActions(incidentId);
  if (count < 1) {
    throw new AppError(
      'RESPONSE_REQUIRED',
      'At least one response action is required before resolving',
      400
    );
  }

  const resolvedAt = new Date();
  const reportedAt = new Date(incident.date_reported);
  const ttrMinutes = Math.round((resolvedAt - reportedAt) / 60000);

  await withTransaction(async (client) => {
    await incidentsRepo.update(client, incidentId, {
      status: 'Resolved',
      resolution_summary: resolutionSummary,
      resolved_at: resolvedAt,
      ttr_minutes: ttrMinutes,
      sla_breached: false,
    });
    await logsRepo.insertLog(client, {
      incidentId,
      actorId: userId,
      actionType: 'INCIDENT_RESOLVED',
      oldValue: incident.status,
      newValue: 'Resolved',
    });
    await logsRepo.insertLog(client, {
      incidentId,
      actorId: userId,
      actionType: 'STATUS_CHANGED',
      oldValue: incident.status,
      newValue: 'Resolved',
    });
  });

  return getIncident(incidentId);
}

async function reopenIncident(incidentId, userId, role) {
  if (role !== 'Admin') {
    throw new AppError('FORBIDDEN', 'Only Admin can reopen incidents', 403);
  }

  const incident = await getIncidentOrThrow(incidentId);

  if (incident.status !== 'Resolved') {
    throw new AppError('INVALID_STATUS', 'Only resolved incidents can be reopened', 400);
  }

  await withTransaction(async (client) => {
    await incidentsRepo.update(client, incidentId, {
      status: 'Reopened',
      resolved_at: null,
      resolution_summary: null,
      ttr_minutes: null,
    });
    await logsRepo.insertLog(client, {
      incidentId,
      actorId: userId,
      actionType: 'INCIDENT_REOPENED',
      oldValue: 'Resolved',
      newValue: 'Reopened',
    });
    await logsRepo.insertLog(client, {
      incidentId,
      actorId: userId,
      actionType: 'STATUS_CHANGED',
      oldValue: 'Resolved',
      newValue: 'Reopened',
    });
  });

  return getIncident(incidentId);
}

async function deleteIncident(incidentId, userId) {
  const incident = await getIncidentOrThrow(incidentId);

  await withTransaction(async (client) => {
    await incidentsRepo.update(client, incidentId, { is_deleted: true });
    await logsRepo.insertLog(client, {
      incidentId,
      actorId: userId,
      actionType: 'INCIDENT_DELETED',
      oldValue: incident.title,
      newValue: 'soft_deleted',
    });
  });
}

async function getTimeline(incidentId) {
  await getIncidentOrThrow(incidentId);
  return incidentsRepo.getTimeline(incidentId);
}

async function getLogs(incidentId) {
  await getIncidentOrThrow(incidentId);
  return logsRepo.findByIncidentId(incidentId);
}

module.exports = {
  listIncidents,
  getIncident,
  createIncident,
  updateIncident,
  assignIncident,
  changeStatus,
  resolveIncident,
  reopenIncident,
  deleteIncident,
  getTimeline,
  getLogs,
  getIncidentOrThrow,
  assertCanModify,
};
