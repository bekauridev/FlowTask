const Organization = require("../models/organizationModel");
const {
  storeNestedDocs,
  updateNestedDocs,
  deleteNestedDocs,
} = require("../controllers/crudHandlerFactory");

// Order to see all websites you should go to this Route
// @route  GET /api/v1/organizations/

// @desc   Create a new website
// @route  POST /api/v1/organizations/:organizationId/websites
// @access Private
exports.createWebsite = storeNestedDocs(Organization, "organizationId", "websites");

// @desc   Update an existing website
// @route  PATCH /api/v1/organizations/:organizationId/websites/:websiteId
// @access Private
exports.updateWebsite = updateNestedDocs(
  Organization,
  "organizationId",
  "websites",
  "websiteId"
);
// @desc   Delete multiple or single website
// @route  DELETE /api/v1/organizations/:organizationId/websites/:websiteId
// @access Private
exports.deleteWebsite = deleteNestedDocs(
  Organization,
  "organizationId",
  "websites",
  "websiteId"
);
