const { randomUUID } = require("crypto");
const GoalPlan = require("../models/goalPlan");
const Task = require("../models/task");
const { generateGoalBreakdown } = require("../services/gemini-planner");
const {
  addDays,
  getDateKeyInTimeZone,
  getPlanningRange,
  isValidDateKey,
  normalizeTimeZone,
  scheduleTasks,
} = require("../services/scheduler");

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const VALID_PRIORITIES = new Set(["low", "medium", "high"]);
const VALID_CATEGORIES = new Set(["work", "personal", "study", "health", "other"]);

const plannerError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const timeToMinutes = (time) => {
  const match = TIME_PATTERN.exec(time || "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const normalizePreferences = (body = {}) => {
  const timeZone = normalizeTimeZone(String(body.timeZone || "UTC"));
  const start = TIME_PATTERN.test(body.workingHours?.start || "")
    ? body.workingHours.start
    : "09:00";
  const end = TIME_PATTERN.test(body.workingHours?.end || "")
    ? body.workingHours.end
    : "17:00";

  if (timeToMinutes(end) <= timeToMinutes(start)) {
    throw plannerError("Working hours must end after they start");
  }

  return {
    timeZone,
    workingHours: { start, end },
    includeWeekends: Boolean(body.includeWeekends),
  };
};

const validateTargetDate = (targetDate, currentDate) => {
  if (!targetDate) {
    return null;
  }

  if (!isValidDateKey(targetDate)) {
    throw plannerError("Target date must use YYYY-MM-DD format");
  }

  if (targetDate < currentDate) {
    throw plannerError("Target date cannot be in the past");
  }

  if (targetDate > addDays(currentDate, 90)) {
    throw plannerError("Target date must be within the next 90 days");
  }

  return targetDate;
};

const normalizeGoal = (value) => {
  const goal = String(value || "").trim();
  if (goal.length < 5 || goal.length > 500) {
    throw plannerError("Goal must be between 5 and 500 characters");
  }
  return goal;
};

const normalizeTask = (task, index) => {
  const title = String(task?.title || "").trim().slice(0, 120);
  if (title.length < 3) {
    throw plannerError(`Task ${index + 1} needs a title`);
  }

  const rawEstimate = Number(task.estimatedMinutes);
  if (!Number.isFinite(rawEstimate)) {
    throw plannerError(`Task ${index + 1} needs an effort estimate`);
  }

  return {
    clientId: String(task.clientId || `task-${index + 1}`).slice(0, 80),
    title,
    description: String(task.description || "").trim().slice(0, 600),
    estimatedMinutes: Math.max(15, Math.min(480, Math.round(rawEstimate))),
    priority: VALID_PRIORITIES.has(task.priority) ? task.priority : "medium",
    category: VALID_CATEGORIES.has(task.category) ? task.category : "other",
    order: Number.isInteger(task.order) ? task.order : index + 1,
  };
};

const findBusyIntervals = async ({ userId, startDate, deadline, timeZone }) => {
  const range = getPlanningRange({ startDate, deadline, timeZone });
  const tasks = await Task.find({
    userId,
    completed: { $ne: true },
    scheduledStart: { $lt: range.end },
    scheduledEnd: { $gt: range.start },
  }).select("scheduledStart scheduledEnd");

  return tasks.map((task) => ({ start: task.scheduledStart, end: task.scheduledEnd }));
};

const buildSchedule = async ({ userId, tasks, currentDate, deadline, preferences }) => {
  const busyIntervals = await findBusyIntervals({
    userId,
    startDate: currentDate,
    deadline,
    timeZone: preferences.timeZone,
  });

  return scheduleTasks({
    tasks,
    startDate: currentDate,
    deadline,
    timeZone: preferences.timeZone,
    workingHours: preferences.workingHours,
    includeWeekends: preferences.includeWeekends,
    busyIntervals,
  });
};

const previewPlan = async (req, res) => {
  try {
    const goal = normalizeGoal(req.body.goal);
    const preferences = normalizePreferences(req.body);
    const currentDate = getDateKeyInTimeZone(new Date(), preferences.timeZone);
    const targetDate = validateTargetDate(req.body.targetDate, currentDate);
    const breakdown = await generateGoalBreakdown({
      goal,
      currentDate,
      targetDate,
      timeZone: preferences.timeZone,
    });
    let deadline = targetDate || breakdown.deadline || addDays(currentDate, 7);

    if (deadline < currentDate) {
      deadline = addDays(currentDate, 7);
    }
    if (deadline > addDays(currentDate, 90)) {
      deadline = addDays(currentDate, 90);
    }

    const schedule = await buildSchedule({
      userId: req.userId,
      tasks: breakdown.tasks,
      currentDate,
      deadline,
      preferences,
    });

    res.status(200).json({
      status: "success",
      data: {
        plan: {
          previewId: randomUUID(),
          originalGoal: goal,
          title: breakdown.title,
          deadline,
          assumptions: breakdown.assumptions,
          timeZone: preferences.timeZone,
          workingHours: preferences.workingHours,
          includeWeekends: preferences.includeWeekends,
          totalEstimatedMinutes: schedule.totalEstimatedMinutes,
          scheduledMinutes: schedule.scheduledMinutes,
          items: schedule.items,
        },
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "fail",
      message: error.statusCode ? error.message : "Could not build the goal plan",
    });
  }
};

const confirmPlan = async (req, res) => {
  let goalPlan;

  try {
    const submittedPlan = req.body.plan || {};
    const originalGoal = normalizeGoal(submittedPlan.originalGoal);
    const title = String(submittedPlan.title || originalGoal).trim().slice(0, 120);
    const preferences = normalizePreferences(submittedPlan);
    const currentDate = getDateKeyInTimeZone(new Date(), preferences.timeZone);
    const deadline = validateTargetDate(submittedPlan.deadline, currentDate);
    const selectedItems = Array.isArray(submittedPlan.items)
      ? submittedPlan.items.filter((item) => item.included !== false).slice(0, 12)
      : [];

    if (!deadline) {
      throw plannerError("The plan needs a deadline");
    }
    if (selectedItems.length === 0) {
      throw plannerError("Select at least one task to add");
    }

    const normalizedTasks = selectedItems.map(normalizeTask);
    const schedule = await buildSchedule({
      userId: req.userId,
      tasks: normalizedTasks,
      currentDate,
      deadline,
      preferences,
    });
    const assumptions = Array.isArray(submittedPlan.assumptions)
      ? submittedPlan.assumptions
          .slice(0, 5)
          .map((assumption) => String(assumption).trim().slice(0, 180))
          .filter(Boolean)
      : [];

    goalPlan = await GoalPlan.create({
      userId: req.userId,
      originalGoal,
      title,
      deadline: new Date(`${deadline}T00:00:00.000Z`),
      assumptions,
      timezone: preferences.timeZone,
      workingHours: {
        ...preferences.workingHours,
        includeWeekends: preferences.includeWeekends,
      },
      totalEstimatedMinutes: schedule.totalEstimatedMinutes,
      scheduledMinutes: schedule.scheduledMinutes,
    });

    const tasks = await Task.insertMany(
      schedule.items.map((item) => ({
        title: item.title,
        description: item.description,
        priority: item.priority,
        category: item.category,
        dueDate: new Date(`${deadline}T00:00:00.000Z`),
        estimatedMinutes: item.estimatedMinutes,
        scheduledStart: item.scheduledStart ? new Date(item.scheduledStart) : undefined,
        scheduledEnd: item.scheduledEnd ? new Date(item.scheduledEnd) : undefined,
        schedulingSource: "ai",
        scheduleLocked: false,
        goalId: goalPlan._id,
        userId: req.userId,
      }))
    );

    res.status(201).json({
      status: "success",
      data: {
        goal: goalPlan,
        tasks,
        rescheduled: schedule.items,
      },
    });
  } catch (error) {
    if (goalPlan?._id) {
      await GoalPlan.findByIdAndDelete(goalPlan._id).catch(() => undefined);
    }

    res.status(error.statusCode || 500).json({
      status: "fail",
      message: error.statusCode ? error.message : "Could not save the goal plan",
    });
  }
};

module.exports = { confirmPlan, previewPlan };
