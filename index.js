require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const config = require("config");
const home = require("./routes/home");
const users = require("./routes/users");
const auth = require("./routes/auth");
const error = require("./middleware/error");

const mongoose = require("mongoose");

const app = express();
const workouts = require("./routes/workouts");
const exercises = require("./routes/exercises");
const workoutLogs = require("./routes/workoutLogs");

if (!config.get("jwtPrivateKey")) {
  console.error("FATAL ERROR: jwtPrivateKey is not defined.");
  process.exit(1);
}

//mongoose zonder foutmelding
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("MONGODB_URI is not defined in .env");
  process.exit(1);
}
mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

app.set("view engine", "pug");
app.set("views", "./views");
app.use(express.static("public"));

app.use(express.json());
console.log("Application Name:", config.get("name"));

// @ts-ignore
app.use(helmet());
// Use morgan only in development
if (app.get("env") === "development") {
  app.use(morgan("tiny"));
  console.log("Morgan enabled...");
}

// Define a route
app.use("/", home);
app.use("/api/workouts", workouts);
app.use("/api/exercises", exercises);
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/workout-logs", workoutLogs);

app.use(error);
const port = process.env.PORT || 3000;

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
