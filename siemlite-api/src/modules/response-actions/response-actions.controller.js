const responseService = require('./response-actions.service');
const { success } = require('../../utils/apiResponse');

async function list(req, res, next) {
  try {
    const responses = await responseService.listResponses(req.params.id);
    return success(res, responses, 'Response actions retrieved');
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const response = await responseService.createResponse(
      req.params.id,
      req.body,
      req.user.userId,
      req.user.role
    );
    return success(res, response, 'Response action logged', 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const response = await responseService.updateResponse(
      req.params.id,
      req.params.rid,
      req.body,
      req.user.userId,
      req.user.role
    );
    return success(res, response, 'Response action updated');
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await responseService.deleteResponse(req.params.id, req.params.rid, req.user.userId);
    return success(res, null, 'Response action deleted');
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create, update, remove };
