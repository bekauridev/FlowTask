const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const asyncMiddleware = require("./asyncMiddleware");

// @desc  Set Logged in user ID automatically in doccument (req.body)
// @route Middleware
exports.setUserId = asyncMiddleware(async (req, res, next) => {
  if (!req.body.user) {
    req.body.user = req.user.id;
  } else {
    const user = await User.findById(req.body.user);

    if (!user)
      return next(new AppError(`No user found with ID: ${req.body.userId}`, 404));
  }
  next();
});
