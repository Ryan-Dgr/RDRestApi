const mongoose = require("mongoose");

const workoutSetSchema = new mongoose.Schema({
  reps: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  kg: {
    type: Number,
    required: true,
    min: 0,
    max: 500,
  },
  type: {
    type: String,
    required: true,
    enum: ["warmup", "normal", "dropset"],
  },
});

const workoutExerciseSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exercise",
    required: true,
  },
  sets: {
    type: [workoutSetSchema],
    required: true,
    validate: {
      validator: function (sets) {
        return sets.length > 0;
      },
      message: "A workout exercise must have at least one set.",
    },
  },
});

const workoutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
  },
  category: {
    type: String,
    required: true,
    enum: ["strength", "cardio"],
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1,
    max: 300,
    validate: {
      // @ type is om geef foutmelding te krijgen
      validator: function (/** @type {number} */ value) {
        if (this.category === "cardio") {
          return value <= 180;
        }

        return true;
      },
      message: "Cardio workouts cannot be longer than 180 minutes.",
    },
  },

  exercises: {
    type: [workoutExerciseSchema],
    default: [],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Workout = mongoose.model("Workout", workoutSchema);

module.exports = Workout;
