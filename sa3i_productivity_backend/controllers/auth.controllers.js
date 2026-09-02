
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");



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
      email, 
      password, 
      role: role || "user",
      photo
    });

    const token = jwt.sign(
      { id: user._id, name: name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res
      .status(201)
      .json({ status: "success", token: token, data: { user: user } });
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

  const existingUser = await User.findOne({ email: email });
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
  
  const token = jwt.sign(
    { id: existingUser._id, name: existingUser.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  
  return res.status(200).json({
    status: "success",
    token: token,
    data: { user: { name: existingUser.name, email, role: existingUser.role, photo: existingUser.photo } },
  });
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
    const { name, phone, photo } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { name, phone},
      { new: true, runValidators: true }
    );

    res.status(200).json({ status: "success", data: { user: updatedUser } });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

module.exports = { 
  signup, 
  getAllUsers, 
  login, 
  protectRoutes, 
  getProfile,
  updateProfile 
};