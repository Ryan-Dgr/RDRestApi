require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const config = require("config");

const home = require("./routes/home");
const workouts = require("./routes/workouts");
const exercises = require("./routes/exercises");
const users = require("./routes/users");
const auth = require("./routes/auth");
const workoutLogs = require("./routes/workoutLogs");
const error = require("./middleware/error");

const app = express();

app.set("view engine", "pug");
app.set("views", "./views");
app.use(express.static("public"));

app.use(express.json());

console.log("Application Name:", config.get("name"));

// @ts-ignore
app.use(helmet());

if (app.get("env") === "development") {
  app.use(morgan("tiny"));
  console.log("Morgan enabled...");
}

app.use("/", home);
app.use("/api/workouts", workouts);
app.use("/api/exercises", exercises);
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/workout-logs", workoutLogs);

app.use(error);

module.exports = app;
