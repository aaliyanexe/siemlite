const repo = require('./threat-types.repository');
const { AppError } = require('../../middleware/errorHandler');

async function list(query) {
  const activeOnly = query.active_only === 'true';
  return repo.findAll(activeOnly);
}

async function getById(id) {
  const row = await repo.findById(id);
  if (!row) throw new AppError('THREAT_TYPE_NOT_FOUND', `Threat type ${id} not found`, 404);
  return row;
}

async function create(data) {
  if (await repo.findByName(data.name)) {
    throw new AppError('NAME_EXISTS', 'Threat type name already exists', 409);
  }
  return repo.create(data);
}

async function update(id, data) {
  await getById(id);
  if (data.name && (await repo.findByName(data.name, id))) {
    throw new AppError('NAME_EXISTS', 'Threat type name already exists', 409);
  }
  return repo.update(id, {
    name: data.name,
    description: data.description,
    category: data.category,
    severity_default: data.severity_default,
  });
}

async function deactivate(id) {
  const row = await getById(id);
  if (!row.is_active) throw new AppError('ALREADY_INACTIVE', 'Threat type already inactive', 400);
  return repo.deactivate(id);
}

module.exports = { list, getById, create, update, deactivate };
