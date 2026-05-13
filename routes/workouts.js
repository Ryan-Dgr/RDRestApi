const express = require("express");
const Joi = require("joi");

const router = express.Router();

// in memory moet in mongodb
const workouts = [
  { id: 1, title: "Push Day", category: "strength", durationMinutes: 75 },
  { id: 2, title: "Pull Day", category: "strength", durationMinutes: 75 },
  { id: 3, title: "Leg Day", category: "strength", durationMinutes: 75 },
  { id: 4, title: "Cardio", category: "cardio", durationMinutes: 30 },
];

// @ts-ignore
function validateWorkout(workout) {
  const schema = Joi.object({
    title: Joi.string().min(3).required(),
    category: Joi.string().valid("strength", "cardio").required(),
    durationMinutes: Joi.number().integer().min(1).required(),
  });

  return schema.validate(workout);
}

// get alle workouts
router.get("/", (req, res) => {
  res.send(workouts);
});

// get workout met id
router.get("/:id", (req, res) => {
  const workout = workouts.find((w) => w.id === parseInt(req.params.id));

  if (!workout) {
    return res.status(404).send("workout niet gevonden");
  }
  res.send(workout);
});

// post workout
router.post("/", (req, res) => {
  const result = validateWorkout(req.body);

  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }

  const workout = {
    id: workouts.length + 1,
    title: req.body.title,
    category: req.body.category,
    durationMinutes: req.body.durationMinutes,
  };

  workouts.push(workout);
  res.status(201).send(workout);
});

// update workout
router.put("/:id", (req, res) => {
  const workout = workouts.find((w) => w.id === parseInt(req.params.id));

  if (!workout) {
    return res.status(404).send("workout niet gevonden");
  }

  const result = validateWorkout(req.body);

  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }

  workout.title = req.body.title;
  workout.category = req.body.category;
  workout.durationMinutes = req.body.durationMinutes;

  res.send(workout);
});

// delete workout
router.delete("/:id", (req, res) => {
  const workout = workouts.find((w) => w.id === parseInt(req.params.id));

  if (!workout) {
    return res.status(404).send("workout niet gevonden");
  }

  const index = workouts.indexOf(workout);
  workouts.splice(index, 1);

  res.send(workout);
});

module.exports = router;
