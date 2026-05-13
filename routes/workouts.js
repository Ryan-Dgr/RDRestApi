const express = require("express");
const Joi = require("joi");
const Workout = require("../models/workout");
const Exercise = require("../models/exercise");
const mongoose = require("mongoose");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// @ts-ignore
function validateWorkout(workout) {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    category: Joi.string().valid("strength", "cardio").required(),
    durationMinutes: Joi.number().integer().min(1).max(300).required(),
    exercises: Joi.array()
      .items(
        Joi.object({
          exercise: Joi.string().required(),
          sets: Joi.number().integer().min(1).max(20).required(),
          reps: Joi.number().integer().min(1).max(100).required(),
          kg: Joi.number().min(0).max(500).required(),
        }),
      )
      .default([]),
  });

  return schema.validate(workout);
}

// Validate MongoDB ObjectId
// @ts-ignore
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Validate exercise ObjectIds inside a workout
// @ts-ignore
function hasValidExerciseIds(exercises = []) {
  return exercises.every((item) => isValidObjectId(item.exercise));
}

// Check if all referenced exercises exist in the database
// @ts-ignore
async function exercisesExist(exercises = []) {
  const exerciseIds = exercises.map((item) => item.exercise);

  const count = await Exercise.countDocuments({
    _id: { $in: exerciseIds },
  });

  return count === exerciseIds.length;
}

// get alle workouts
router.get("/", async (req, res) => {
  const workouts = await Workout.find()
    .sort({ title: 1 })
    .populate("exercises.exercise");

  res.send(workouts);
});

// get workout met id
router.get("/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).send("ongeldige workout id");
  }

  const workout = await Workout.findById(req.params.id).populate(
    "exercises.exercise",
  );

  if (!workout) {
    return res.status(404).send("workout niet gevonden");
  }

  res.send(workout);
});

// post workout
router.post("/", auth, async (req, res) => {
  const result = validateWorkout(req.body);

  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }
  if (!hasValidExerciseIds(req.body.exercises)) {
    return res.status(400).send("ongeldige exercise id");
  }
  if (!(await exercisesExist(req.body.exercises))) {
    return res.status(400).send("een of meerdere oefeningen bestaan niet");
  }

  const workout = new Workout({
    title: req.body.title,
    category: req.body.category,
    durationMinutes: req.body.durationMinutes,
    exercises: req.body.exercises,
  });

  try {
    await workout.save();
    res.status(201).send(workout);
  } catch (err) {
    // @ts-ignore
    res.status(400).send(err.message);
  }
});

// update workout
router.put("/:id", auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).send("ongeldige workout id");
  }
  const result = validateWorkout(req.body);

  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }
  if (!hasValidExerciseIds(req.body.exercises)) {
    return res.status(400).send("ongeldige exercise id");
  }
  if (!(await exercisesExist(req.body.exercises))) {
    return res.status(400).send("een of meerdere oefeningen bestaan niet");
  }

  let workout;

  try {
    workout = await Workout.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        category: req.body.category,
        durationMinutes: req.body.durationMinutes,
        exercises: req.body.exercises,
      },
      { new: true, runValidators: true },
    );
  } catch (err) {
    // @ts-ignore
    return res.status(400).send(err.message);
  }

  if (!workout) {
    return res.status(404).send("workout niet gevonden");
  }

  res.send(workout);
});

// delete workout
router.delete("/:id", auth, admin, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).send("ongeldige workout id");
  }
  const workout = await Workout.findByIdAndDelete(req.params.id);

  if (!workout) {
    return res.status(404).send("workout niet gevonden");
  }

  res.send(workout);
});

module.exports = router;
