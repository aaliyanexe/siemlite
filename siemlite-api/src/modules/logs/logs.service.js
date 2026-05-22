const logsRepo = require('./logs.repository');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

async function listSystemLogs(query) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await logsRepo.findAll(
    {
      actor_id: query.actor_id,
      action_type: query.action_type,
      date_from: query.date_from,
      date_to: query.date_to,
    },
    limit,
    offset
  );
  return { logs: rows, pagination: buildPaginationMeta(page, limit, total) };
}

module.exports = { listSystemLogs };
