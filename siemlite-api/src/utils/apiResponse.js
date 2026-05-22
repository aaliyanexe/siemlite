function success(res, data = null, message = 'OK', statusCode = 200, pagination = null) {
  const body = { success: true, data, message };
  if (pagination) {
    body.pagination = pagination;
  }
  return res.status(statusCode).json(body);
}

function error(res, code, message, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

module.exports = { success, error };
