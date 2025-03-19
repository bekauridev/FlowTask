const AppError = require("../utils/AppError");
const asyncMiddleware = require("./asyncMiddleware");

// @desc   Reject password update
// @route  Protect middleware
exports.declinePasswordUpdate = asyncMiddleware(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError(`This route is not for password updates. `, 400));
  }
  next();
});
