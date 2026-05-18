const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");
const Workout = require("../models/workout");
const Exercise = require("../models/exercise");
const WorkoutLog = require("../models/workoutLog");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const asyncMiddleware = require("../middleware/async");

const router = express.Router();

function validateWorkout(workout) {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    category: Joi.string().valid("strength", "cardio").required(),
    durationMinutes: Joi.number().integer().min(1).max(300).required(),
    exercises: Joi.array().items(Joi.string()).default([]),
  });

  return schema.validate(workout);
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function hasValidExerciseIds(exercises = []) {
  return exercises.every((exerciseId) => isValidObjectId(exerciseId));
}

async function exercisesExist(exercises = []) {
  const count = await Exercise.countDocuments({
    _id: { $in: exercises },
  });

  return count === exercises.length;
}

// get all workouts
router.get(
  "/",
  asyncMiddleware(async (req, res) => {
    const workouts = await Workout.find()
      .sort({ title: 1 })
      .populate("exercises");

    res.send(workouts);
  }),
);

// get workout by id
router.get(
  "/:id",
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send("ongeldige workout id");
    }

    const workout = await Workout.findById(req.params.id).populate("exercises");

    if (!workout) {
      return res.status(404).send("workout niet gevonden");
    }

    res.send(workout);
  }),
);

// create workout
router.post(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
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

    await workout.save();

    res.status(201).send(workout);
  }),
);

// update workout
router.put(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
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

    const workout = await Workout.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        category: req.body.category,
        durationMinutes: req.body.durationMinutes,
        exercises: req.body.exercises,
      },
      { new: true, runValidators: true },
    );

    if (!workout) {
      return res.status(404).send("workout niet gevonden");
    }

    res.send(workout);
  }),
);

// delete workout
router.delete(
  "/:id",
  auth,
  admin,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send("ongeldige workout id");
    }

    const workoutLogUsingWorkout = await WorkoutLog.findOne({
      workout: req.params.id,
    });

    if (workoutLogUsingWorkout) {
      return res
        .status(400)
        .send(
          "workout kan niet verwijderd worden omdat ze gebruikt wordt in een workout log",
        );
    }

    const workout = await Workout.findByIdAndDelete(req.params.id);

    if (!workout) {
      return res.status(404).send("workout niet gevonden");
    }

    res.send(workout);
  }),
);

module.exports = router;
