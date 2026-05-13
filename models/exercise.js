const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100,
  },
  muscleGroup: {
    type: String,
    required: true,
    enum: ["chest", "back", "legs", "shoulders", "arms", "core", "full body"],
  },
  equipment: {
    type: String,
    required: true,
    enum: [
      "barbell",
      "dumbbell",
      "machine",
      "bodyweight",
      "cable",
      "kettlebell",
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

module.exports = Exercise;
