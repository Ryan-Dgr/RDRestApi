const express = require("express");
const Joi = require("joi");
const Exercise = require("../models/exercise");

const router = express.Router();

/**
 * @param {{ name: string, muscleGroup: string, equipment: string }} exercise
 */
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

// get all exercises
router.get("/", async (req, res) => {
  const exercises = await Exercise.find().sort({ name: 1 });
  res.send(exercises);
});

// get exercise by id
router.get("/:id", async (req, res) => {
  const exercise = await Exercise.findById(req.params.id);

  if (!exercise) {
    return res.status(404).send("exercise niet gevonden");
  }

  res.send(exercise);
});

// create exercise
router.post("/", async (req, res) => {
  const result = validateExercise(req.body);

  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }

  const exercise = new Exercise({
    name: req.body.name,
    muscleGroup: req.body.muscleGroup,
    equipment: req.body.equipment,
  });

  try {
    await exercise.save();
    res.status(201).send(exercise);
  } catch (err) {
    // @ts-ignore
    res.status(400).send(err.message);
  }
});

module.exports = router;
