const express = require("express");
const userControllers = require("../controllers/auth.controllers");
const upload = require("../middleware/upload.middleware");
const router = express.Router();
const multerErrorHandler = require("../middleware/multer.error.handler");

router.route("/signup").post(upload.single("photo"), multerErrorHandler, userControllers.signup);
router.post("/login", userControllers.login);
router.post("/demo", userControllers.demoLogin);
router.get("/", userControllers.protectRoutes, userControllers.getAllUsers);
router.get("/profile", userControllers.protectRoutes, userControllers.getProfile);
router.patch(
  "/profile",
  userControllers.protectRoutes,
  userControllers.blockDemoWrites,
  upload.single("photo"),
  multerErrorHandler,
  userControllers.updateProfile
);

module.exports = router;

// get post put delete
// view create update delete 
// const response = axios.get("localhost:3000/users", { });
// console.log(response);
// 
