const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
  title: String,
  category: String,
  durationMinutes: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Workout = mongoose.model("Workout", workoutSchema);

module.exports = Workout;
