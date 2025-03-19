const express = require("express");
const authController = require("../controllers/authController");
const labelController = require("../controllers/labelController");

const { setUserFilter } = require("../middlewares/filterByUser");
const { setUserId } = require("../middlewares/setUserIdMiddleware");

const router = express.Router();

router.use(authController.protect, authController.checkVerification, setUserFilter);

router
  .route("/")
  .get(labelController.indexLabels)
  .post(setUserId, labelController.storeLabel);

router
  .route("/:id")
  .get(labelController.showLabel)
  .patch(labelController.updateLabel)
  .delete(labelController.destroyLabel);

module.exports = router;
