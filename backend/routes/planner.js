const express = require("express");
const plannerControllers = require("../controllers/planner.controllers");
const userControllers = require("../controllers/auth.controllers");

const router = express.Router();

router.post("/preview", userControllers.protectRoutes, plannerControllers.previewPlan);
router.post(
  "/confirm",
  userControllers.protectRoutes,
  userControllers.blockDemoWrites,
  plannerControllers.confirmPlan
);

module.exports = router;
