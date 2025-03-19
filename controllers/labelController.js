const crudHandlerFactory = require("./crudHandlerFactory");
const Label = require("../models/labelModel");

/////////////////////////////////////
// CRUD Using crudHandlerFactory

// @desc   Retrieve a list of Labels
// @route  GET /api/v1/labels
// @access Private
exports.indexLabels = crudHandlerFactory.indexDoc(Label);

// @desc   Retrieve a single label by ID
// @route  GET /api/v1/labels/:id
// @access Private
exports.showLabel = crudHandlerFactory.showDoc(Label);

// @desc   Create a Label
// @route  POST /api/v1/labels/
// @access Private
exports.storeLabel = crudHandlerFactory.storeDoc(Label);

// @desc   Update a Label
// @route  PATCH /api/v1/labels/:id
// @access Private
exports.updateLabel = crudHandlerFactory.updateDoc(Label);

// @desc   Delete a Label
// @route  DELETE /api/v1/labels/:id
// @access Private
exports.destroyLabel = crudHandlerFactory.destroyDoc(Label);
