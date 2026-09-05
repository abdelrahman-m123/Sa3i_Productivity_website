require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Task = require("../models/task");
const User = require("../models/user");

const email = process.argv[2] || "test@example.com";
const name = process.argv[3] || (email === "test@example.com" ? "Demo User" : email.split("@")[0]);

const DEMO_USER = {
  name,
  username: email.toLowerCase().replace(/[^a-z0-9]/g, "-"),
  email,
  password: "password123",
  photo: "profile.png",
  role: "user",
  isDemo: true,
};

const toDate = (offset) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

const sampleTasks = [
  {
    title: "Prepare portfolio dashboard screenshots",
    description: "Capture the dashboard, calendar, and Kanban views for the README.",
    priority: "high",
    category: "work",
    dueDate: toDate(0),
    status: "todo",
  },
  {
    title: "Review overdue project notes",
    description: "Clean up any old notes and turn action items into tasks.",
    priority: "high",
    category: "study",
    dueDate: toDate(-1),
    status: "todo",
  },
  {
    title: "Refine calendar drag and drop polish",
    description: "Check small-screen behavior and empty-day drop targets.",
    priority: "medium",
    category: "work",
    dueDate: toDate(0),
    status: "inProgress",
  },
  {
    title: "Plan next feature sprint",
    description: "Pick the next portfolio feature after analytics.",
    priority: "medium",
    category: "work",
    dueDate: toDate(1),
    status: "todo",
  },
  {
    title: "Write API notes for profile update",
    description: "Document the profile edit endpoint and upload behavior.",
    priority: "medium",
    category: "study",
    dueDate: toDate(2),
    status: "todo",
  },
  {
    title: "Exercise break",
    description: "Take a short walk and reset focus.",
    priority: "low",
    category: "health",
    dueDate: toDate(0),
    status: "todo",
  },
  {
    title: "Archive completed UI checklist",
    description: "Mark finished visual QA notes as complete.",
    priority: "low",
    category: "other",
    dueDate: toDate(-2),
    status: "done",
    completed: true,
  },
  {
    title: "Update README feature list",
    description: "Mention dashboard effort planning, calendar scheduling, and Kanban.",
    priority: "high",
    category: "work",
    dueDate: toDate(3),
    status: "todo",
  },
  {
    title: "Organize personal admin tasks",
    description: "Sort small life admin tasks into categories.",
    priority: "low",
    category: "personal",
    dueDate: toDate(4),
    status: "todo",
  },
  {
    title: "Validate auth logout behavior",
    description: "Confirm header/profile state clears after logout.",
    priority: "high",
    category: "work",
    dueDate: toDate(-3),
    status: "done",
    completed: true,
  },
];

const seed = async () => {
  const dbName = process.env.DB_NAME || process.env.db_Name || process.env.d_bName;

  await mongoose.connect(process.env.MONGO_URI, {
    ...(dbName ? { dbName } : {}),
  });

  const password = await bcrypt.hash(DEMO_USER.password, 10);
  const user = await User.findOneAndUpdate(
    { email: DEMO_USER.email },
    { ...DEMO_USER, password },
    { new: true, upsert: true, runValidators: true }
  );

  await Task.deleteMany({
    userId: user._id,
    title: { $in: sampleTasks.map((task) => task.title) },
  });

  const tasks = await Task.insertMany(
    sampleTasks.map((task) => ({
      completed: false,
      ...task,
      userId: user._id,
    }))
  );

  console.log(`Seeded demo mode with ${tasks.length} tasks for ${DEMO_USER.email}`);
};

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
