const express = require("express");
const authController = require("../controllers/authController");
const taskController = require("../controllers/taskController");
const setUserIdMiddleware = require("../middlewares/setUserIdMiddleware");
const setOrganizationMiddleware = require("../middlewares/setOrganizationMiddleware");
const { setUserFilter } = require("../middlewares/filterByUser");
const exportTasksToExcel = require("../services/exportTasksToExcelService");

const router = express.Router({ mergeParams: true });

router.use(authController.protect, authController.checkVerification);
router.post(
  "/",
  setUserIdMiddleware.setUserId,
  setOrganizationMiddleware.setOrganizationId,
  taskController.storeTask
);

router.post("/export-tasks", exportTasksToExcel);

router.use(setUserFilter);

router.route("/").get(taskController.indexTasks);

router
  .route("/:id")
  .get(taskController.showTask)
  .patch(taskController.updateTask)
  .delete(taskController.destroyTask);

module.exports = router;
