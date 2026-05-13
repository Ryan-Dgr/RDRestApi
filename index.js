require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const config = require("config");
const app = express();
const workouts = require("./routes/workouts");

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
app.get("/", (req, res) => {
  res.send("Workout API");
});

app.use("/api/workouts", workouts);

const port = process.env.PORT || 3000;

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
