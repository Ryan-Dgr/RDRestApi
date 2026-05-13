require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const config = require("config");
const logger = require("./middleware/logger");
const home = require("./routes/home");
const mongoose = require("mongoose");

const app = express();
const workouts = require("./routes/workouts");

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
app.use(logger);
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

const port = process.env.PORT || 3000;

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
