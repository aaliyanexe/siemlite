const responseRepo = require('./response-actions.repository');
const incidentsService = require('../incidents/incidents.service');
const logsRepo = require('../logs/logs.repository');
const { withTransaction } = require('../../config/db');
const { AppError } = require('../../middleware/errorHandler');

const EDIT_WINDOW_MS = 60 * 60 * 1000;

async function listResponses(incidentId) {
  await incidentsService.getIncidentOrThrow(incidentId);
  return responseRepo.findByIncident(incidentId);
}

async function createResponse(incidentId, data, userId, role) {
  const incident = await incidentsService.getIncidentOrThrow(incidentId);

  if (role !== 'Admin' && incident.assigned_analyst_id !== userId) {
    throw new AppError(
      'FORBIDDEN',
      'Only the assigned analyst can log response actions',
      403
    );
  }

  const response = await withTransaction(async (client) => {
    const created = await responseRepo.create(client, {
      incidentId,
      analystId: userId,
      actionType: data.action_type,
      actionDescription: data.action_description,
    });

    await logsRepo.insertLog(client, {
      incidentId,
      actorId: userId,
      actionType: 'RESPONSE_ACTION_ADDED',
      newValue: `${data.action_type}: ${data.action_description.substring(0, 100)}`,
    });

    return created;
  });

  const full = await responseRepo.findById(response.response_id, incidentId);
  return full;
}

async function updateResponse(incidentId, responseId, data, userId, role) {
  await incidentsService.getIncidentOrThrow(incidentId);
  const response = await responseRepo.findById(responseId, incidentId);

  if (!response) {
    throw new AppError('RESPONSE_NOT_FOUND', `Response action ${responseId} not found`, 404);
  }

  if (role !== 'Admin') {
    if (response.analyst_id !== userId) {
      throw new AppError('FORBIDDEN', 'You can only edit your own response actions', 403);
    }
    const created = new Date(response.action_date);
    if (Date.now() - created.getTime() > EDIT_WINDOW_MS) {
      throw new AppError(
        'EDIT_WINDOW_EXPIRED',
        'Response actions can only be edited within 1 hour of creation',
        403
      );
    }
  }

  const oldDesc = response.action_description;
  const oldType = response.action_type;

  await withTransaction(async (client) => {
    await responseRepo.update(client, responseId, incidentId, data);
    await logsRepo.insertLog(client, {
      incidentId,
      actorId: userId,
      actionType: 'RESPONSE_ACTION_EDITED',
      oldValue: `${oldType}: ${oldDesc.substring(0, 80)}`,
      newValue: `${data.action_type || oldType}: ${(data.action_description || oldDesc).substring(0, 80)}`,
    });
  });

  return responseRepo.findById(responseId, incidentId);
}

async function deleteResponse(incidentId, responseId, userId) {
  await incidentsService.getIncidentOrThrow(incidentId);
  const response = await responseRepo.findById(responseId, incidentId);

  if (!response) {
    throw new AppError('RESPONSE_NOT_FOUND', `Response action ${responseId} not found`, 404);
  }

  await withTransaction(async (client) => {
    await responseRepo.softDelete(client, responseId, incidentId);
    await logsRepo.insertLog(client, {
      incidentId,
      actorId: userId,
      actionType: 'RESPONSE_ACTION_DELETED',
      oldValue: `${response.action_type}: ${response.action_description.substring(0, 100)}`,
      newValue: 'deleted',
    });
  });
}

module.exports = { listResponses, createResponse, updateResponse, deleteResponse };
