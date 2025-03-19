const asyncMiddleware = require("../middlewares/asyncMiddleware");
const ApiFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/AppError");

// Common Parameters Description
//  @param   {Model} Model - The Mongoose model representing the collection.

//  @desc   Retrieve a list of documents with optional filtering
//  The function takes in the request `req` and returns a query filter object.

exports.indexDoc = (Model) =>
  asyncMiddleware(async (req, res, next) => {
    const filter = Object.entries(req.filter).length ? req.filter : {};
    console.log(filter);
    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    res.status(200).json({
      status: "success",
      results: doc.length,
      data: doc,
    });
  });

// @desc  This function retrieves a single document from the database by its ID, with support for optional population of related fields using the query string parameter `populate`.
exports.showDoc = (Model) =>
  asyncMiddleware(async (req, res, next) => {
    // Apply the filter based on the request (e.g., logged-in user)
    const filter = Object.entries(req.filter).length ? req.filter : {};

    // Find the document by ID and apply any additional filters
    let query = Model.findOne({ _id: req.params.id, ...filter });

    // Check if the populate field is provided and apply it for multiple fields
    if (req.query.populate) {
      const populateFields = req.query.populate.split(","); // Split by comma
      populateFields.forEach((field) => {
        query = query.populate(field.trim());
      });
    }

    // Execute the query
    const doc = await query;

    if (!doc) {
      return next(new AppError(`No document found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      status: "success",
      data: doc,
    });
  });

// @desc  Create a new document
exports.storeDoc = (Model) =>
  asyncMiddleware(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: doc,
    });
  });

// @desc Create a new nested document
exports.storeNestedDocs = (parentModel, parentParamIdName, nestedFieldName) =>
  asyncMiddleware(async (req, res, next) => {
    //get params from URL e.g., /example/:exampleId
    const parentId = req.params[parentParamIdName]; // e.g., exampleId
    const filter = Object.entries(req.filter).length ? req.filter : {}; // additional filters

    // Nested document from the request body
    const newNestedDoc = req.body;

    // Update the parent document by pushing the new nested document into the specified field
    const updatedParent = await parentModel.findOneAndUpdate(
      { _id: parentId, ...filter },
      { $push: { [nestedFieldName]: { $each: newNestedDoc } } }, // push docs one by one
      { new: true, runValidators: true }
    );

    if (!updatedParent) {
      return next(new AppError(`No document found with id of ${parentId}`, 404));
    }

    res.status(201).json({
      status: "success",
      data: updatedParent,
    });
  });

// @desc Update a single document by ID
exports.updateDoc = (Model) =>
  asyncMiddleware(async (req, res, next) => {
    // Apply the filter based on the request (e.g., logged-in user)
    const filter = Object.entries(req.filter).length ? req.filter : {};
    // Find the document by ID and apply the filter, then update it
    const doc = await Model.findOneAndUpdate(
      // Apply the filter and match the document by ID
      { _id: req.params.id, ...filter },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!doc) {
      return next(new AppError(`No document found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      status: "success",
      data: doc,
    });
  });

/**
 * @desc    Updates a specific nested document inside a parent document
 * @routeExample   PATCH /parent/:parentParamIdName/child/:nestedParamIdName
 * @param   {Model} parentModel - The Parent Mongoose model
 * @param   {String} parentParamIdName - URL param name for the parent doc ID
 * @param   {String} nestedFieldName - Field in parent where nested docs live
 * @param   {String} nestedParamIdName - URL param name for the nested doc ID
 * @access  Private
 * @returns {Object} - The updated nested document doesn't updates duplicates
 */
exports.updateNestedDocs = (
  parentModel,
  parentParamIdName,
  nestedFieldName,
  nestedParamIdName
) =>
  asyncMiddleware(async (req, res, next) => {
    // Grab IDs from the URL parameters
    const parentId = req.params[parentParamIdName]; // e.g., organizationId
    const nestedFieldId = req.params[nestedParamIdName]; // e.g., websiteId

    // Check if request body has update data
    const body = req.body;
    if (!body || Object.keys(body).length === 0)
      return next(new AppError(`No fields provided to update`, 400));

    // Find the parent document
    const parent = await parentModel.findById(parentId);
    if (!parent)
      return next(new AppError(`No document found with id of ${parentId}`, 404));

    // Find the specific nested doc inside the parent
    const nestedDoc = parent[nestedFieldName].id(nestedFieldId);
    if (!nestedDoc)
      return next(
        new AppError(
          `No ${nestedFieldName} found with id of ${nestedFieldId} in ${parentModel.modelName.toLowerCase()}`,
          404
        )
      );

    // Prepare updates: only keep fields that actually changed
    let updatedFields = {};
    Object.entries(body).forEach(([key, value]) => {
      if (nestedDoc[key] !== value) updatedFields[key] = value;
    });

    // Return original doc if nothing changes
    if (Object.keys(updatedFields).length === 0)
      return res.status(200).json({
        status: "success",
        data: nestedDoc,
      });

    // Apply updates to the nested document
    Object.assign(nestedDoc, updatedFields);
    // Save the updated document
    await parent.save({ validateBeforeSave: false }); // Skip unnecessary validation

    res.status(200).json({
      status: "success",
      data: nestedDoc,
    });
  });
// exports.updateWebsite = asyncMiddleware(async (req, res, next) => {
//   const organizationId = req.params.organizationId;
//   const websiteId = req.params.websiteId;

//   const organization = await Organization.findById(organizationId);

//   if (!organization) {
//     return next(new AppError(`No organization found with id of ${organizationId}`, 404));
//   }

//   const website = organization.websites.id(websiteId);

//   if (!website) {
//     return next(new AppError(`No website found with id of ${websiteId}`, 404));
//   }
//   // Update the website fields
//   Object.assign(website, req.body);

//   // Save the updated organization document
//   await organization.save({ validateBeforeSave: false });

//   res.status(200).json({
//     status: "success",
//     data: website,
//   });
// });

//  @desc   Delete a single document by ID
exports.destroyDoc = (Model) =>
  asyncMiddleware(async (req, res, next) => {
    // Apply the filter based on the request (e.g., logged-in user)
    const filter = Object.entries(req.filter).length ? req.filter : {};
    // Find the document by ID and apply the filter, then delete it
    const doc = await Model.findOneAndDelete({ _id: req.params.id, ...filter });

    if (!doc) {
      return next(new AppError(`No document found with id of ${req.params.id}`, 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
