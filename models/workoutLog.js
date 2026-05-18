const mongoose = require("mongoose");

const workoutLogSetSchema = new mongoose.Schema({
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

const workoutLogExerciseSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exercise",
    required: true,
  },
  sets: {
    type: [workoutLogSetSchema],
    default: [],
  },
});

const workoutLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  workout: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workout",
    required: true,
  },
  performedAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  exercises: {
    type: [workoutLogExerciseSchema],
    required: true,
    validate: {
      validator: function (exercises) {
        return exercises.length > 0;
      },
      message: "A workout log must have at least one exercise.",
    },
  },
});

const WorkoutLog = mongoose.model("WorkoutLog", workoutLogSchema);

module.exports = WorkoutLog;
