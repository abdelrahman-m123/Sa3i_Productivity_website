const express = require("express");
const taskControllers = require("../controllers/task.controllers");
const userControllers = require("../controllers/auth.controllers");

const router = express.Router();

router
  .route("/")
  .post(userControllers.protectRoutes, taskControllers.createTask)
  .get(userControllers.protectRoutes, taskControllers.getTasks);

router
  .route("/:id")
  .get(userControllers.protectRoutes, taskControllers.getTaskById)
  .patch(userControllers.protectRoutes, taskControllers.updateTask)
  .delete(userControllers.protectRoutes, taskControllers.deleteTask);
router
  .route("/user/:userId")
  .get(userControllers.protectRoutes,taskControllers.getUserTasks)

module.exports = router;
