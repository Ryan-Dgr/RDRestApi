const express = require("express");
const app = express();

app.use(express.json());

const workouts = [
  { id: 1, title: "Push Day", category: "strength", durationMinutes: 75 },
  { id: 2, title: "Pull Day", category: "strength", durationMinutes: 75 },
  { id: 3, title: "Leg Day", category: "strength", durationMinutes: 75 },
  { id: 3, title: "Cardio", category: "cardio", durationMinutes: 30 },
];

// Define a route
app.get("/", (req, res) => {
  res.send("Workout API");
});

app.get("/api/workouts", (req, res) => {
  res.send(workouts);
});

// Start the server
app.listen(3000, () => {
  console.log("Listening on port 3000...");
});
