const Task = require("../models/task");

const applyScheduleRules = (taskData, existingTask = null) => {
  const includesStart = Object.prototype.hasOwnProperty.call(taskData, "scheduledStart");
  const includesEnd = Object.prototype.hasOwnProperty.call(taskData, "scheduledEnd");

  if (!includesStart && !includesEnd) {
    return taskData;
  }

  const scheduledStart = includesStart ? taskData.scheduledStart : existingTask?.scheduledStart;
  const scheduledEnd = includesEnd ? taskData.scheduledEnd : existingTask?.scheduledEnd;
  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);

  if (!scheduledStart || !scheduledEnd || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const error = new Error("Scheduled tasks need a valid start and end time");
    error.statusCode = 400;
    throw error;
  }

  if (end <= start) {
    const error = new Error("Scheduled end time must be after the start time");
    error.statusCode = 400;
    throw error;
  }

  return {
    ...taskData,
    scheduledStart: start,
    scheduledEnd: end,
    schedulingSource: taskData.schedulingSource || existingTask?.schedulingSource || "manual",
    scheduleLocked: true,
  };
};

const getTasks = async (req, res) => {
  try {
    
    
    const page = +req.query.page || null;
    const limit = +req.query.limit || null;
    const skip = (page - 1) * limit;
    const tasks = await Task.find({ userId: req.userId }).skip(skip).limit(limit);
    res.status(200).json({
      status: "success",
      total: tasks.length,
      data: tasks
    });
  } catch (error) {
   
    res.status(500).json({
      status: "fail",
      message: "Something went wrong: " + error.message
    });
  }
};

const createTask = async (req, res) => {
  try {
    const taskData = applyScheduleRules({
      ...req.body,
      userId: req.userId
    });
    
    const task = await Task.create(taskData);
    res.status(201).json({
      status: "success",
      data: { task: task }
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: "fail", message: error.message });
  }
};

const getUserTasks = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 5;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({ userId: userId }).skip(skip).limit(limit); // database
    res.status(200).json({
      status: "success",
      total: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: "Something went wrong: " + error.message
    });
  }
};

// 

// signup/:id
// req.params.id =
// req params localhost/signup/123471-023475
// req body

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!task) {
      return res.status(404).json({
        status: "fail",
        message: "Task not found"
      });
    }
    
    res.status(200).json({ status: "success", data: { task: task } });
  } catch (error) {
    res.status(404).json({ status: "fail", message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const existingTask = await Task.findOne({ _id: req.params.id, userId: req.userId });

    if (!existingTask) {
      return res.status(404).json({
        status: "fail",
        message: "Task not found"
      });
    }

    const updateData = applyScheduleRules(req.body, existingTask);
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedTask) {
      return res.status(404).json({
        status: "fail",
        message: "Task not found"
      });
    }
    
    res.status(200).json({ status: "success", data: { task: updatedTask } });
  } catch (error) {
    res.status(error.statusCode || 400).json({ status: "fail", message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!deletedTask) {
      return res.status(404).json({
        status: "fail",
        message: "Task not found"
      });
    }
    
    res.status(200).json({ status: "success", data: { task: deletedTask } });
  } catch (error) {
    res.status(404).json({ status: "fail", message: error.message });
  }
};


module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getUserTasks
};
