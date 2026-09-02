const express = require("express");
require("dotenv").config();
const path = require("path");
const connectDB = require("./config/db");
const userRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const cors = require("cors"); 

const app = express();
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, 'uploads')));
connectDB();

app.use(express.json());


app.use("/users", userRoutes);
app.use("/tasks", taskRoutes);


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



module.exports = app;