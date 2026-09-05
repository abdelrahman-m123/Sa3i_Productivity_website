const express = require("express");
require("dotenv").config();
const path = require("path");
const connectDB = require("./config/db");
const userRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const plannerRoutes = require("./routes/planner");
const cors = require("cors"); 

const app = express();
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, 'uploads')));
connectDB();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "sa3i-api" });
});

app.use("/users", userRoutes);
app.use("/tasks", taskRoutes);
app.use("/ai-plans", plannerRoutes);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// localhost:3000


module.exports = app;
