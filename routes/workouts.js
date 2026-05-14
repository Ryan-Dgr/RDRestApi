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
      .default([]),
  });

  return schema.validate(workout);
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function hasValidExerciseIds(exercises = []) {
  return exercises.every((item) => isValidObjectId(item.exercise));
}

function validateWorkoutExercise(workoutExercise) {
  const schema = Joi.object({
    exercise: Joi.string().required(),
    sets: Joi.array()
      .items(
        Joi.object({
          reps: Joi.number().integer().min(1).max(100).required(),
          kg: Joi.number().min(0).max(500).required(),
          type: Joi.string().valid("warmup", "normal", "dropset").required(),
        }),
      )
      .min(1)
      .required(),
  });

  return schema.validate(workoutExercise);
}

function validateWorkoutSet(workoutSet) {
  const schema = Joi.object({
    reps: Joi.number().integer().min(1).max(100).required(),
    kg: Joi.number().min(0).max(500).required(),
    type: Joi.string().valid("warmup", "normal", "dropset").required(),
  });

  return schema.validate(workoutSet);
}

async function exercisesExist(exercises = []) {
  const exerciseIds = exercises.map((item) => item.exercise);

  const count = await Exercise.countDocuments({
    _id: { $in: exerciseIds },
  });

  return count === exerciseIds.length;
}

// get all workouts
router.get(
  "/",
  asyncMiddleware(async (req, res) => {
    const workouts = await Workout.find()
      .sort({ title: 1 })
      .populate("exercises.exercise");

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

    const workout = await Workout.findById(req.params.id).populate(
      "exercises.exercise",
    );

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

// add exercise to workout
router.post(
  "/:id/exercises",
  auth,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send("ongeldige workout id");
    }

    const result = validateWorkoutExercise(req.body);

    if (result.error) {
      return res.status(400).send(result.error.details[0].message);
    }

    if (!isValidObjectId(req.body.exercise)) {
      return res.status(400).send("ongeldige exercise id");
    }

    const exercise = await Exercise.findById(req.body.exercise);

    if (!exercise) {
      return res.status(400).send("exercise bestaat niet");
    }

    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).send("workout niet gevonden");
    }

    workout.exercises.push({
      exercise: req.body.exercise,
      sets: req.body.sets,
    });

    await workout.save();

    res.status(201).send(workout);
  }),
);

// add set to workout exercise
router.post(
  "/:workoutId/exercises/:exerciseEntryId/sets",
  auth,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.workoutId)) {
      return res.status(400).send("ongeldige workout id");
    }

    if (!isValidObjectId(req.params.exerciseEntryId)) {
      return res.status(400).send("ongeldige workout exercise id");
    }

    const result = validateWorkoutSet(req.body);

    if (result.error) {
      return res.status(400).send(result.error.details[0].message);
    }

    const workout = await Workout.findById(req.params.workoutId);

    if (!workout) {
      return res.status(404).send("workout niet gevonden");
    }

    const workoutExercise = workout.exercises.id(req.params.exerciseEntryId);

    if (!workoutExercise) {
      return res.status(404).send("exercise niet gevonden in workout");
    }

    workoutExercise.sets.push(req.body);

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
