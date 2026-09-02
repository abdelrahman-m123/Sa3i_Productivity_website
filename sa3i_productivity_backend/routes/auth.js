const express = require("express");
const userControllers = require("../controllers/auth.controllers");
const upload = require("../middleware/upload.middleware");
const router = express.Router();
const multerErrorHandler = require("../middleware/multer.error.handler");

router.route("/signup").post(upload.single("photo"), multerErrorHandler, userControllers.signup);
router.post("/login", userControllers.login);
router.get("/", userControllers.protectRoutes, userControllers.getAllUsers);
router.get("/profile", userControllers.protectRoutes, userControllers.getProfile);
router.patch("/profile", userControllers.protectRoutes, userControllers.updateProfile);

module.exports = router;