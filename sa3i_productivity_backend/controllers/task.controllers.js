const Task = require("../models/task");

const getTasks = async (req, res) => {
  try {
    
    
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 5;
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
    const taskData = {
      ...req.body,
      userId: req.userId
    };
    
    const task = await Task.create(taskData);
    res.status(201).json({
      status: "success",
      data: { task: task }
    });
  } catch (error) {
    res.status(404).json({ status: "fail", message: error.message });
  }
};

const getUserTasks = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 5;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({ userId: userId }).skip(skip).limit(limit);
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
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
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
    res.status(404).json({ status: "fail", message: error.message });
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