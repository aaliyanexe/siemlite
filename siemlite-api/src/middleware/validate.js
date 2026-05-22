const { error: apiError } = require('../utils/apiResponse');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return apiError(res, 'VALIDATION_ERROR', issues.join('; '), 400);
    }

    const { body, query, params } = result.data;
    if (body !== undefined) req.body = body;
    if (query !== undefined) req.query = query;
    if (params !== undefined) req.params = params;

    return next();
  };
}

module.exports = { validate };
