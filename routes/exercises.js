const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");
const Exercise = require("../models/exercise");
const Workout = require("../models/workout");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const asyncMiddleware = require("../middleware/async");

const router = express.Router();

function validateExercise(exercise) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    muscleGroup: Joi.string()
      .valid("chest", "back", "legs", "shoulders", "arms", "core", "full body")
      .required(),
    equipment: Joi.string()
      .valid(
        "barbell",
        "dumbbell",
        "machine",
        "bodyweight",
        "cable",
        "kettlebell",
      )
      .required(),
  });

  return schema.validate(exercise);
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// get all exercises
router.get(
  "/",
  asyncMiddleware(async (req, res) => {
    const exercises = await Exercise.find().sort({ name: 1 });
    res.send(exercises);
  }),
);

// get exercise by id
router.get(
  "/:id",
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send("ongeldige exercise id");
    }

    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).send("exercise niet gevonden");
    }

    res.send(exercise);
  }),
);

// create exercise
router.post(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const result = validateExercise(req.body);

    if (result.error) {
      return res.status(400).send(result.error.details[0].message);
    }

    const exercise = new Exercise({
      name: req.body.name,
      muscleGroup: req.body.muscleGroup,
      equipment: req.body.equipment,
    });

    await exercise.save();

    res.status(201).send(exercise);
  }),
);

// update exercise
router.put(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send("ongeldige exercise id");
    }

    const result = validateExercise(req.body);

    if (result.error) {
      return res.status(400).send(result.error.details[0].message);
    }

    const exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        muscleGroup: req.body.muscleGroup,
        equipment: req.body.equipment,
      },
      { new: true, runValidators: true },
    );

    if (!exercise) {
      return res.status(404).send("exercise niet gevonden");
    }

    res.send(exercise);
  }),
);

// delete exercise
router.delete(
  "/:id",
  auth,
  admin,
  asyncMiddleware(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send("ongeldige exercise id");
    }

    const workoutUsingExercise = await Workout.findOne({
      "exercises.exercise": req.params.id,
    });

    if (workoutUsingExercise) {
      return res
        .status(400)
        .send(
          "exercise kan niet verwijderd worden omdat ze gebruikt wordt in een workout",
        );
    }

    const exercise = await Exercise.findByIdAndDelete(req.params.id);

    if (!exercise) {
      return res.status(404).send("exercise niet gevonden");
    }

    res.send(exercise);
  }),
);

module.exports = router;
