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
    const parentId = req.params[parentParamIdName]; // e.g., organizationId
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

//  @desc Update a single document by ID
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
