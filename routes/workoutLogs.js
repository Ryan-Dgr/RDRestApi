const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");
const WorkoutLog = require("../models/workoutLog");
const Workout = require("../models/workout");
const Exercise = require("../models/exercise");
const auth = require("../middleware/auth");
const asyncMiddleware = require("../middleware/async");

const router = express.Router();

function validateWorkoutLog(workoutLog) {
  const schema = Joi.object({
    workout: Joi.string().required(),
    performedAt: Joi.date(),
    notes: Joi.string().max(500),
    exercises: Joi.array()
      .items(
        Joi.object({
          exercise: Joi.string().required(),
          sets: Joi.array()
            .items(
              Joi.object({
                reps: Joi.number().integer().min(1).max(100).required(),
                kg: Joi.number().min(0).max(500).required(),
                type: Joi.string()
                  .valid("warmup", "normal", "dropset")
                  .required(),
              }),
            )
            .min(1)
            .required(),
        }),
      )
      .min(1)
      .required(),
  });

  return schema.validate(workoutLog);
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function hasValidExerciseIds(exercises = []) {
  return exercises.every((item) => isValidObjectId(item.exercise));
}

async function exercisesExist(exercises = []) {
  const exerciseIds = exercises.map((item) => item.exercise);

  const count = await Exercise.countDocuments({
    _id: { $in: exerciseIds },
  });

  return count === exerciseIds.length;
}

// get current user's workout logs
router.get(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const logs = await WorkoutLog.find({ user: req.user._id })
      .sort({ performedAt: -1 })
      .populate("workout")
      .populate("exercises.exercise");

    res.send(logs);
  }),
);

// get workout log by id
router.get(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send("ongeldige workout log id");
    }

    const log = await WorkoutLog.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("workout")
      .populate("exercises.exercise");

    if (!log) {
      return res.status(404).send("workout log niet gevonden");
    }

    res.send(log);
  }),
);

// create workout log
router.post(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const result = validateWorkoutLog(req.body);

    if (result.error) {
      return res.status(400).send(result.error.details[0].message);
    }

    if (!isValidObjectId(req.body.workout)) {
      return res.status(400).send("ongeldige workout id");
    }

    if (!hasValidExerciseIds(req.body.exercises)) {
      return res.status(400).send("ongeldige exercise id");
    }

    const workout = await Workout.findById(req.body.workout);

    if (!workout) {
      return res.status(400).send("workout bestaat niet");
    }

    if (!(await exercisesExist(req.body.exercises))) {
      return res.status(400).send("een of meerdere oefeningen bestaan niet");
    }

    const log = new WorkoutLog({
      user: req.user._id,
      workout: req.body.workout,
      performedAt: req.body.performedAt,
      notes: req.body.notes,
      exercises: req.body.exercises,
    });

    await log.save();

    res.status(201).send(log);
  }),
);

// update workout log
router.put(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send("ongeldige workout log id");
    }

    const result = validateWorkoutLog(req.body);

    if (result.error) {
      return res.status(400).send(result.error.details[0].message);
    }

    if (!isValidObjectId(req.body.workout)) {
      return res.status(400).send("ongeldige workout id");
    }

    if (!hasValidExerciseIds(req.body.exercises)) {
      return res.status(400).send("ongeldige exercise id");
    }

    const workout = await Workout.findById(req.body.workout);

    if (!workout) {
      return res.status(400).send("workout bestaat niet");
    }

    if (!(await exercisesExist(req.body.exercises))) {
      return res.status(400).send("een of meerdere oefeningen bestaan niet");
    }

    const log = await WorkoutLog.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        workout: req.body.workout,
        performedAt: req.body.performedAt,
        notes: req.body.notes,
        exercises: req.body.exercises,
      },
      { new: true, runValidators: true },
    );

    if (!log) {
      return res.status(404).send("workout log niet gevonden");
    }

    res.send(log);
  }),
);

// delete workout log
router.delete(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send("ongeldige workout log id");
    }

    const log = await WorkoutLog.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!log) {
      return res.status(404).send("workout log niet gevonden");
    }

    res.send(log);
  }),
);

module.exports = router;
