const asyncMiddleware = require("../middlewares/asyncMiddleware");
const Organization = require("../models/organizationModel");

const AppError = require("../utils/AppError");

// Order to see all websites you should go to this Route
// @route  GET /api/v1/organizations/

// @desc   Create a new website
// @route  GET /api/v1/organizations/organizationId/websites
// @access Private
exports.createWebsite = asyncMiddleware(async (req, res, next) => {
  const organizationId = req.params.organizationId;
  const filter = req.filter || {};

  const newWebsite = {
    name: req.body.name,
    url: req.body.url,
    identifier: req.body.identifier,
    passwordRecord: req.body.passwordRecord,
  };

  // Update the organization by pushing the new website into the embedded array
  const updatedOrganization = await Organization.findOneAndUpdate(
    { _id: organizationId, ...filter },
    { $push: { websites: newWebsite } },
    { new: true, runValidators: true }
  );

  if (!updatedOrganization) {
    return next(new AppError(`No organization found with id of ${organizationId}`, 404));
  }

  res.status(201).json({
    status: "success",
    data: {
      organization: updatedOrganization,
    },
  });
});

// @desc   Update an existing website
// @route  PATCH /api/v1/organizations/organizationId/websites/websiteId
// @access Private
exports.updateWebsite = asyncMiddleware(async (req, res, next) => {
  const organizationId = req.params.organizationId;
  const websiteId = req.params.websiteId;
  const filter = req.filter || {};

  const organization = await Organization.findOne({ _id: organizationId, ...filter });

  if (!organization) {
    return next(new AppError(`No organization found with id of ${organizationId}`, 404));
  }

  // Find the website by its unique ID within the websites array
  const website = organization.websites.id(websiteId);

  if (!website) {
    return next(new AppError(`No website found with id of ${websiteId}`, 404));
  }

  // Update the website fields
  Object.assign(website, req.body);

  // Save the updated organization document
  await organization.save();

  res.status(200).json({
    status: "success",
    data: {
      updatedWebsite: website,
    },
  });
});

// @desc   Delete multiple or single website
// @route  DELETE /api/v1/organizatiosn/organizationId/websites
// @route  DELETE /api/v1/organizations/organizationId/websites/websiteId
exports.deleteWebsite = asyncMiddleware(async (req, res, next) => {
  const { organizationId, websiteId } = req.params;
  const filter = req.filter || {};

  // Find the organization
  const organization = await Organization.findOne({ _id: organizationId, ...filter });

  if (!organization) {
    return next(new AppError(`No organization found with id of ${organizationId}`, 404));
  }

  // Ensure the organization has websites
  if (!organization.websites || organization.websites.length === 0) {
    return next(
      new AppError(`The websites list is already empty for this organization.`, 400)
    );
  }

  let updatedOrganization;

  if (websiteId) {
    // Check if the website exists
    const websiteExists = organization.websites.some(
      (website) => website._id.toString() === websiteId
    );
    if (!websiteExists) {
      return next(new AppError(`No website found with the provided ID`, 404));
    }

    // Remove the website by its ID
    updatedOrganization = await Organization.findByIdAndUpdate(
      organizationId,
      { $pull: { websites: { _id: websiteId } } },
      { new: true, runValidators: true }
    );
  } else {
    // Remove all websites if no websiteId is provided
    updatedOrganization = await Organization.findByIdAndUpdate(
      organizationId,
      { $set: { websites: [] } },
      { new: true, runValidators: true }
    );
  }

  // Check if the update was successful
  if (!updatedOrganization) {
    return next(
      new AppError(`Failed to update organization with id of ${organizationId}`, 500)
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
