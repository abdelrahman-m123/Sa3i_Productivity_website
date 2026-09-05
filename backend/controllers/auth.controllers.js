
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const createAuthResponse = (user) => ({
  token: jwt.sign(
    { id: user._id, name: user.name, isDemo: user.isDemo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  ),
  user: {
    name: user.name,
    email: user.email,
    role: user.role,
    photo: user.photo,
    isDemo: user.isDemo,
  },
});

const sendAuthResponse = (res, statusCode, user) => {
  const { token, user: sessionUser } = createAuthResponse(user);

  return res.status(statusCode).json({
    status: "success",
    token,
    data: { user: sessionUser },
  });
};



const signup = async (req, res) => {
  try {
    let { password, name, photo, email, role } = req.body;
    photo = req.file?.filename || "profile.png";

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      fs.unlinkSync(path.join(__dirname, "../uploads", photo));
      return res.status(400).json({
        status: "fail",
        message: "user already exists",
      });
    }
    
    password = await bcrypt.hash(password, 10);

    const user = await User.create({ 
      name, 
      username: email.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      email, 
      password, 
      role: role || "user",
      photo
    });

    return sendAuthResponse(res, 201, user);
  } catch (error) {
    fs.unlinkSync(path.join(__dirname, "../uploads", photo));
    res
      .status(400)
      .json({ status: "fail", message: `Error in Sign up ${error.message}` });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res
      .status(400)
      .json({ status: "fail", message: "Email or Password is missing" });
  }

  const existingUser = await User.findOne({ email: email }); // database
  if (!existingUser) {
    return res.status(404).json({
      status: "fail",
      message: "User not exists",
    });
  }

  const matchedPassword = await bcrypt.compare(password, existingUser.password);
  if (!matchedPassword) {
    return res.status(404).json({
      status: "fail",
      message: "User not exists",
    });
  }
  
  return sendAuthResponse(res, 200, existingUser);
};

const demoLogin = async (req, res) => {
  try {
    const demoUser = await User.findOne({ isDemo: true });

    if (!demoUser) {
      return res.status(503).json({
        status: "fail",
        message: "Demo mode is not available yet",
      });
    }

    return sendAuthResponse(res, 200, demoUser);
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: `Unable to start demo mode: ${error.message}`,
    });
  }
};

const protectRoutes = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith("Bearer")) {
      token = token.split(" ")[1];
    }
    if (!token) {
      return res
        .status(400)
        .json({ status: "fail", message: "You are not logged in" });
    }
    
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodedToken.id;
    
    const currentUser = await User.findById(decodedToken.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "User no longer exists"
      });
    }
    
    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({ status: "fail", message: error.message });
  }
};

const DEMO_ALLOWED_TASK_PATCH_FIELDS = new Set([
  "completed",
  "status",
  "dueDate",
  "scheduledStart",
  "scheduledEnd",
]);

const isAllowedDemoTaskPatch = (req) => {
  if (req.baseUrl !== "/tasks" || req.method !== "PATCH") {
    return false;
  }

  const fields = Object.keys(req.body || {});
  return (
    fields.length > 0 &&
    fields.every((field) => DEMO_ALLOWED_TASK_PATCH_FIELDS.has(field))
  );
};

const blockDemoWrites = (req, res, next) => {
  if (req.user?.isDemo) {
    if (isAllowedDemoTaskPatch(req)) {
      return next();
    }

    return res.status(403).json({
      status: "fail",
      message: "Demo mode is read-only. Sign up to save changes.",
    });
  }

  next();
};

const getAllUsers = async (req, res) => {
  try {
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 5;
    const skip = (page - 1) * limit;
    const users = await User.find({}, { password: false, __v: false }).skip(skip).limit(limit);
    res
      .status(200)
      .json({ status: "success", length: users.length, data: { users } });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId, { password: false, __v: false });
    res.status(200).json({ status: "success", data: { user: user } });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData = {};

    if (name) {
      updateData.name = name;
    }

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });

      if (existingUser) {
        return res.status(400).json({
          status: "fail",
          message: "Email is already in use",
        });
      }

      updateData.email = email;
    }

    if (req.file?.filename) {
      updateData.photo = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
      select: "-password -__v",
    });

    res.status(200).json({ status: "success", data: { user: updatedUser } });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

module.exports = { 
  signup, 
  getAllUsers, 
  login, 
  demoLogin,
  protectRoutes, 
  blockDemoWrites,
  getProfile,
  updateProfile 
};
