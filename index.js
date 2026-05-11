const express = require("express");
const app = express();

app.use(express.json());

// in memory moet in mongodb
const workouts = [
  { id: 1, title: "Push Day", category: "strength", durationMinutes: 75 },
  { id: 2, title: "Pull Day", category: "strength", durationMinutes: 75 },
  { id: 3, title: "Leg Day", category: "strength", durationMinutes: 75 },
  { id: 4, title: "Cardio", category: "cardio", durationMinutes: 30 },
];

// Define a route
app.get("/", (req, res) => {
  res.send("Workout API");
});

// get alle workouts
app.get("/api/workouts", (req, res) => {
  res.send(workouts);
});

// get workout met id
app.get("/api/workouts/:id", (req, res) => {
  const workout = workouts.find((w) => w.id === parseInt(req.params.id));

  if (!workout) {
    return res.status(404).send("workout niet gevonden");
  }
  res.send(workout);
});

// Start the server
app.listen(3000, () => {
  console.log("Listening on port 3000...");
});
