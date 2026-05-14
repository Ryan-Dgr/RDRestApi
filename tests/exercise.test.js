const { describe, test } = require("node:test");
const assert = require("node:assert");
const Exercise = require("../models/exercise");

describe("Exercise Mongoose validation", () => {
  test("accepts a valid exercise", async () => {
    const exercise = new Exercise({
      name: "Bench Press",
      muscleGroup: "chest",
      equipment: "barbell",
    });

    await exercise.validate();

    assert.strictEqual(exercise.name, "Bench Press");
  });

  test("rejects an invalid muscle group", async () => {
    const exercise = new Exercise({
      name: "Bench Press",
      muscleGroup: "invalid",
      equipment: "barbell",
    });

    await assert.rejects(
      async () => {
        await exercise.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });

  test("rejects an invalid equipment type", async () => {
    const exercise = new Exercise({
      name: "Bench Press",
      muscleGroup: "chest",
      equipment: "invalid",
    });

    await assert.rejects(
      async () => {
        await exercise.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });

  test("rejects an exercise without a name", async () => {
    const exercise = new Exercise({
      muscleGroup: "chest",
      equipment: "barbell",
    });

    await assert.rejects(
      async () => {
        await exercise.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });
});
