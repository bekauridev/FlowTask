const Organization = require("../models/organizationModel");
const AppError = require("../utils/AppError");
const asyncMiddleware = require("./asyncMiddleware");

// @desc  Automatically set organization if not in doccument (req.body)  ! ALSO This function filters based on current user if user has not organization task will not added
// @route Middleware
exports.setOrganizationId = asyncMiddleware(async (req, res, next) => {
  if (!req.body.organization) req.body.organization = req.params.organizationId;

  // Check if organization exists and is related to the user
  const organization = await Organization.findOne({
    _id: req.body.organization,
    user: req.user.id,
  });

  // If organization is not found or does not belong to the user, return error
  if (!organization) {
    return next(
      new AppError(
        `No organization found with ID: ${req.body.organization} for this user`,
        404
      )
    );
  }

  next();
});
