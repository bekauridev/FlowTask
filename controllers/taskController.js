const crudHandlerFactory = require("../controllers/crudHandlerFactory");
const Task = require("../models/taskModel");

/////////////////////////////////////
// CRUD Using crudHandlerFactory

// @desc   Retrieve a list of Completed Tasks
// @route  GET /api/v1/tasks
// @access Private
exports.indexTasks = crudHandlerFactory.indexDoc(Task);

// @desc   Retrieve a single task by ID
// @route  GET /api/v1/tasks/:id
// @access Private
exports.showTask = crudHandlerFactory.showDoc(Task);

// @desc   Create a Task
// @route  POST /api/v1/tasks/
// @access Private
exports.storeTask = crudHandlerFactory.storeDoc(Task);

// @desc   Update a Task
// @route  PATCH /api/v1/tasks/:id
// @access Private
exports.updateTask = crudHandlerFactory.updateDoc(Task);

// @desc   Delete a Task
// @route  DELETE /api/v1/tasks/:id
// @access Private
exports.destroyTask = crudHandlerFactory.destroyDoc(Task);
