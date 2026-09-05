const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Task title is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["todo", "inProgress", "done"],
    default: "todo",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  category: {
    type: String,
    enum: ["work", "personal", "study", "health", "other"],
    default: "other",
  },
  dueDate: {
    type: Date,
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GoalPlan",
  },
  estimatedMinutes: {
    type: Number,
    min: 15,
    max: 480,
  },
  scheduledStart: {
    type: Date,
  },
  scheduledEnd: {
    type: Date,
  },
  schedulingSource: {
    type: String,
    enum: ["manual", "ai"],
    default: "manual",
  },
  scheduleLocked: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Task must belong to a user"],
  },
  
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
