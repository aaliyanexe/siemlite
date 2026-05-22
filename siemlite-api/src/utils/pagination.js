function parsePagination(query, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildPaginationMeta(page, limit, total) {
  const pages = Math.ceil(total / limit) || 1;
  return { page, limit, total, pages };
}

module.exports = { parsePagination, buildPaginationMeta };
