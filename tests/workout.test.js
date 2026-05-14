const { describe, test } = require("node:test");
const assert = require("node:assert");
const Workout = require("../models/workout");

describe("Workout Mongoose validation", () => {
  test("accepts a valid workout", async () => {
    const workout = new Workout({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439011",
          sets: [
            {
              reps: 10,
              kg: 80,
              type: "normal",
            },
          ],
        },
      ],
    });

    await workout.validate();

    assert.strictEqual(workout.title, "Push Day");
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

  test("rejects workout exercise without sets", async () => {
    const workout = new Workout({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439011",
          sets: [],
        },
      ],
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

  test("rejects invalid reps", async () => {
    const workout = new Workout({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439011",
          sets: [
            {
              reps: 0,
              kg: 80,
              type: "normal",
            },
          ],
        },
      ],
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

  test("rejects invalid kg", async () => {
    const workout = new Workout({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439011",
          sets: [
            {
              reps: 10,
              kg: -5,
              type: "normal",
            },
          ],
        },
      ],
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

  test("rejects invalid set type", async () => {
    const workout = new Workout({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439011",
          sets: [
            {
              reps: 10,
              kg: 80,
              type: "heavy",
            },
          ],
        },
      ],
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
