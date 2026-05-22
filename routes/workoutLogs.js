const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");
const WorkoutLog = require("../models/workoutLog");
const Workout = require("../models/workout");
const auth = require("../middleware/auth");
const asyncMiddleware = require("../middleware/async");

const router = express.Router();

function validateWorkoutLog(workoutLog) {
  const schema = Joi.object({
    workout: Joi.string().required(),
    performedAt: Joi.date(),
    notes: Joi.string().max(500),
  });

  return schema.validate(workoutLog);
}

function validateWorkoutLogSet(workoutLogSet) {
  const schema = Joi.object({
    reps: Joi.number().integer().min(1).max(100).required(),
    kg: Joi.number().min(0).max(500).required(),
    type: Joi.string().valid("warmup", "normal", "dropset").required(),
  });

  return schema.validate(workoutLogSet);
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
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

    const workout = await Workout.findById(req.body.workout);

    if (!workout) {
      return res.status(400).send("workout bestaat niet");
    }

    if (workout.exercises.length === 0) {
      return res.status(400).send("workout heeft geen oefeningen");
    }

    const log = new WorkoutLog({
      user: req.user._id,
      workout: req.body.workout,
      performedAt: req.body.performedAt,
      notes: req.body.notes,
      exercises: workout.exercises.map((exerciseId) => ({
        exercise: exerciseId,
        sets: [],
      })),
    });

    await log.save();

    res.status(201).send(log);
  }),
);

// sets toevoegen
router.post(
  "/:logId/exercises/:exerciseEntryId/sets",
  auth,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.logId)) {
      return res.status(400).send("ongeldige workout log id");
    }

    if (!isValidObjectId(req.params.exerciseEntryId)) {
      return res.status(400).send("ongeldige workout log exercise id");
    }

    const result = validateWorkoutLogSet(req.body);

    if (result.error) {
      return res.status(400).send(result.error.details[0].message);
    }

    const log = await WorkoutLog.findOne({
      _id: req.params.logId,
      user: req.user._id,
    });

    if (!log) {
      return res.status(404).send("workout log niet gevonden");
    }

    const workoutLogExercise = log.exercises.id(req.params.exerciseEntryId);

    if (!workoutLogExercise) {
      return res.status(404).send("exercise niet gevonden in workout log");
    }

    workoutLogExercise.sets.push(req.body);

    await log.save();

    res.status(201).send(log);
  }),
);

// set aanpassen
router.put(
  "/:logId/exercises/:exerciseEntryId/sets/:setId",
  auth,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.logId)) {
      return res.status(400).send("ongeldige workout log id");
    }

    if (!isValidObjectId(req.params.exerciseEntryId)) {
      return res.status(400).send("ongeldige workout log exercise id");
    }

    if (!isValidObjectId(req.params.setId)) {
      return res.status(400).send("ongeldige set id");
    }

    const result = validateWorkoutLogSet(req.body);

    if (result.error) {
      return res.status(400).send(result.error.details[0].message);
    }

    const log = await WorkoutLog.findOne({
      _id: req.params.logId,
      user: req.user._id,
    });

    if (!log) {
      return res.status(404).send("workout log niet gevonden");
    }

    const workoutLogExercise = log.exercises.id(req.params.exerciseEntryId);

    if (!workoutLogExercise) {
      return res.status(404).send("exercise niet gevonden in workout log");
    }

    const workoutLogExerciseSet = workoutLogExercise.sets.id(req.params.setId);

    if (!workoutLogExerciseSet) {
      return res.status(404).send("set niet gevonden in exercise");
    }

    workoutLogExerciseSet.reps = req.body.reps;
    workoutLogExerciseSet.kg = req.body.kg;
    workoutLogExerciseSet.type = req.body.type;

    await log.save();

    res.send(log);
  }),
);

// set verwijderen
router.delete(
  "/:logId/exercises/:exerciseEntryId/sets/:setId",
  auth,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.logId)) {
      return res.status(400).send("ongeldige workout log id");
    }

    if (!isValidObjectId(req.params.exerciseEntryId)) {
      return res.status(400).send("ongeldige workout log exercise id");
    }

    if (!isValidObjectId(req.params.setId)) {
      return res.status(400).send("ongeldige set id");
    }

    const log = await WorkoutLog.findOne({
      _id: req.params.logId,
      user: req.user._id,
    });

    if (!log) {
      return res.status(404).send("workout log niet gevonden");
    }

    const workoutLogExercise = log.exercises.id(req.params.exerciseEntryId);

    if (!workoutLogExercise) {
      return res.status(404).send("exercise niet gevonden in workout log");
    }

    const workoutLogExerciseSet = workoutLogExercise.sets.id(req.params.setId);

    if (!workoutLogExerciseSet) {
      return res.status(404).send("set niet gevonden in exercise");
    }

    workoutLogExercise.sets.pull(req.params.setId);

    await log.save();

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
