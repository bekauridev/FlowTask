const express = require("express");
const authController = require("../controllers/authController");
const websiteController = require("../controllers/websiteController");
const { setUserFilter } = require("../middlewares/filterByUser");

const router = express.Router({ mergeParams: true });

router.use(authController.protect, authController.checkVerification, setUserFilter);

router
  .route("/")
  .post(websiteController.createWebsite)
  .delete(websiteController.deleteWebsite);

router
  .route("/:websiteId")
  .patch(websiteController.updateWebsite) // Update a doc
  .delete(websiteController.deleteWebsite); // Delete a doc

module.exports = router;
