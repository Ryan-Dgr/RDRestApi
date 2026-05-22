const { describe, test } = require("node:test");
const assert = require("node:assert");
const Workout = require("../models/workout");

describe("Workout Mongoose validation", () => {
  test("accepts a valid workout", async () => {
    const exerciseId = "507f1f77bcf86cd799439011";
    const workout = new Workout({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
      exercises: [exerciseId],
    });

    await workout.validate();

    assert.strictEqual(workout.title, "Push Day");
    assert.deepStrictEqual(
      workout.exercises.map((id) => id.toString()),
      [exerciseId],
    );
  });

  test("defaults exercises to an empty array", async () => {
    const workout = new Workout({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
    });

    await workout.validate();

    assert.strictEqual(workout.exercises.length, 0);
  });

  test("rejects a workout without title", async () => {
    const workout = new Workout({
      category: "strength",
      durationMinutes: 60,
      exercises: [],
    });

    await assert.rejects(
      async () => {
        await workout.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });

  test("rejects an invalid category", async () => {
    const workout = new Workout({
      title: "Push Day",
      category: "invalid",
      durationMinutes: 60,
      exercises: [],
    });

    await assert.rejects(
      async () => {
        await workout.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });

  test("rejects duration below minimum", async () => {
    const workout = new Workout({
      title: "Push Day",
      category: "strength",
      durationMinutes: 0,
      exercises: [],
    });

    await assert.rejects(
      async () => {
        await workout.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });

  test("rejects an invalid exercise id", async () => {
    const workout = new Workout({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
      exercises: ["not-an-object-id"],
    });

    await assert.rejects(
      async () => {
        await workout.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });
});
