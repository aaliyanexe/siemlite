const repo = require('./assets.repository');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { AppError } = require('../../middleware/errorHandler');

async function list(query) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await repo.findAll(
    {
      asset_type: query.asset_type,
      department: query.department,
      criticality: query.criticality,
      active_only: query.active_only,
    },
    limit,
    offset
  );
  return { assets: rows, pagination: buildPaginationMeta(page, limit, total) };
}

async function getById(id) {
  const row = await repo.findById(id);
  if (!row) throw new AppError('ASSET_NOT_FOUND', `Asset ${id} not found`, 404);
  return row;
}

async function create(data) {
  return repo.create(data);
}

async function update(id, data) {
  await getById(id);
  return repo.update(id, data);
}

async function deactivate(id) {
  const row = await getById(id);
  if (!row.is_active) throw new AppError('ALREADY_INACTIVE', 'Asset already inactive', 400);
  return repo.deactivate(id);
}

async function getIncidents(id) {
  await getById(id);
  const history = await repo.getIncidentHistory(id);
  const exposureScore = history.exposure_by_severity.reduce((sum, r) => sum + r.count, 0);
  return { ...history, exposure_score: exposureScore };
}

module.exports = { list, getById, create, update, deactivate, getIncidents };
