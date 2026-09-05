const mongoose = require("mongoose");

const goalPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  originalGoal: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  deadline: {
    type: Date,
    required: true,
  },
  assumptions: {
    type: [String],
    default: [],
  },
  timezone: {
    type: String,
    required: true,
    default: "UTC",
  },
  workingHours: {
    start: { type: String, required: true },
    end: { type: String, required: true },
    includeWeekends: { type: Boolean, default: false },
  },
  totalEstimatedMinutes: {
    type: Number,
    required: true,
    min: 0,
  },
  scheduledMinutes: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["confirmed", "completed"],
    default: "confirmed",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const GoalPlan = mongoose.model("GoalPlan", goalPlanSchema);

module.exports = GoalPlan;
