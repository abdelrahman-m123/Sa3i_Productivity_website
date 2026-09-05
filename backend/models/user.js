const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "User Name is Required"] },
  username: { type: String, unique: true, sparse: true },
  email: {
    type: String,
    required: [true, "Email is Required"],
    unique: true,
    validate: [validator.isEmail, "Please Enter a Valid Email"],
  },
  photo: { type: String, default: "profile.png" },
  password: {
    type: String,
    required: [true, "Password is Required"],
    minlength: [8, "Minimum Length must be more than 8 characters"],
  },
  role: {
    type: String,
    enum: ["user", "admin", "premium"],
    default: "user",
  },
  isDemo: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  lastLogin: {
    type: Date,
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
