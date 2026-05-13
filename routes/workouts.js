const express = require("express");
const Joi = require("joi");
const Workout = require("../models/workout");
const mongoose = require("mongoose");
const router = express.Router();

// @ts-ignore
function validateWorkout(workout) {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    category: Joi.string().valid("strength", "cardio").required(),
    durationMinutes: Joi.number().integer().min(1).max(300).required(),
  });

  return schema.validate(workout);
}

// Validate MongoDB ObjectId
// @ts-ignore
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// get alle workouts
router.get("/", async (req, res) => {
  const workouts = await Workout.find().sort({ title: 1 });
  res.send(workouts);
});

// get workout met id
router.get("/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).send("ongeldige workout id");
  }

  const workout = await Workout.findById(req.params.id);

  if (!workout) {
    return res.status(404).send("workout niet gevonden");
  }

  res.send(workout);
});

// post workout
router.post("/", async (req, res) => {
  const result = validateWorkout(req.body);

  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }

  const workout = new Workout({
    title: req.body.title,
    category: req.body.category,
    durationMinutes: req.body.durationMinutes,
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
router.put("/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).send("ongeldige workout id");
  }
  const result = validateWorkout(req.body);

  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }

  let workout;

  try {
    workout = await Workout.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        category: req.body.category,
        durationMinutes: req.body.durationMinutes,
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
router.delete("/:id", async (req, res) => {
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
