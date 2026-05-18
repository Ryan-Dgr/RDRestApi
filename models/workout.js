const mongoose = require("mongoose");

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
  },

  exercises: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
      },
    ],
    default: [],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Workout = mongoose.model("Workout", workoutSchema);

module.exports = Workout;
