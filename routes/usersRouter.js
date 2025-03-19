const express = require("express");
const usersController = require("../controllers/usersController");
const {
  declinePasswordUpdate,
} = require("../middlewares/declinePasswordUpdateMiddleware");

const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.get("/getMe", usersController.getMe);
router.patch("/updateMe", declinePasswordUpdate, usersController.updateMe);

router.delete("/deleteMe", usersController.deleteMe);

// Admin-only routes
router.use(authController.checkRole("admin"));
// Admin routes for user management
router
  .route("/")
  .get(usersController.indexUsers) // Retrieve all users
  .post(usersController.storeUser); // Create a new user

router
  .route("/:id")
  .patch(declinePasswordUpdate, usersController.updateUser) // Update a user
  .delete(usersController.destroyUser)
  .get(usersController.showUser); // Retrieve a specific user by ID
module.exports = router;
