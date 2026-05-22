const { describe, test } = require("node:test");
const assert = require("node:assert");
const WorkoutLog = require("../models/workoutLog");

describe("WorkoutLog Mongoose validation", () => {
  test("accepts a valid workout log", async () => {
    const workoutLog = new WorkoutLog({
      user: "507f1f77bcf86cd799439011",
      workout: "507f1f77bcf86cd799439012",
      notes: "Strong push session.",
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439013",
          sets: [
            {
              reps: 10,
              kg: 60,
              type: "warmup",
            },
            {
              reps: 8,
              kg: 80,
              type: "normal",
            },
          ],
        },
      ],
    });

    await workoutLog.validate();

    assert.strictEqual(workoutLog.notes, "Strong push session.");
  });

  test("rejects a workout log without user", async () => {
    const workoutLog = new WorkoutLog({
      workout: "507f1f77bcf86cd799439012",
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439013",
          sets: [
            {
              reps: 8,
              kg: 80,
              type: "normal",
            },
          ],
        },
      ],
    });

    await assert.rejects(
      async () => {
        await workoutLog.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });

  test("rejects a workout log without workout", async () => {
    const workoutLog = new WorkoutLog({
      user: "507f1f77bcf86cd799439011",
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439013",
          sets: [
            {
              reps: 8,
              kg: 80,
              type: "normal",
            },
          ],
        },
      ],
    });

    await assert.rejects(
      async () => {
        await workoutLog.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });

  test("rejects a workout log without exercises", async () => {
    const workoutLog = new WorkoutLog({
      user: "507f1f77bcf86cd799439011",
      workout: "507f1f77bcf86cd799439012",
      exercises: [],
    });

    await assert.rejects(
      async () => {
        await workoutLog.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });

  test("accepts a logged exercise without sets", async () => {
    const workoutLog = new WorkoutLog({
      user: "507f1f77bcf86cd799439011",
      workout: "507f1f77bcf86cd799439012",
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439013",
          sets: [],
        },
      ],
    });

    await workoutLog.validate();

    assert.strictEqual(workoutLog.exercises[0].sets.length, 0);
  });

  test("rejects invalid reps", async () => {
    const workoutLog = new WorkoutLog({
      user: "507f1f77bcf86cd799439011",
      workout: "507f1f77bcf86cd799439012",
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439013",
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
        await workoutLog.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });

  test("rejects invalid kg", async () => {
    const workoutLog = new WorkoutLog({
      user: "507f1f77bcf86cd799439011",
      workout: "507f1f77bcf86cd799439012",
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439013",
          sets: [
            {
              reps: 8,
              kg: -5,
              type: "normal",
            },
          ],
        },
      ],
    });

    await assert.rejects(
      async () => {
        await workoutLog.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });

  test("rejects invalid set type", async () => {
    const workoutLog = new WorkoutLog({
      user: "507f1f77bcf86cd799439011",
      workout: "507f1f77bcf86cd799439012",
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439013",
          sets: [
            {
              reps: 8,
              kg: 80,
              type: "heavy",
            },
          ],
        },
      ],
    });

    await assert.rejects(
      async () => {
        await workoutLog.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });

  test("rejects notes longer than 500 characters", async () => {
    const workoutLog = new WorkoutLog({
      user: "507f1f77bcf86cd799439011",
      workout: "507f1f77bcf86cd799439012",
      notes: "a".repeat(501),
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439013",
          sets: [
            {
              reps: 8,
              kg: 80,
              type: "normal",
            },
          ],
        },
      ],
    });

    await assert.rejects(
      async () => {
        await workoutLog.validate();
      },
      {
        name: "ValidationError",
      },
    );
  });
});
