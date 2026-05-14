const { describe, test } = require("node:test");
const assert = require("node:assert");
const { validate } = require("../models/workout");

describe("Workout validation", () => {
  test("accepts a valid workout", () => {
    const result = validate({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439011",
          sets: 4,
          reps: 10,
          kg: 80,
        },
      ],
    });

    assert.strictEqual(result.error, undefined);
  });

  test("rejects a workout without title", () => {
    const result = validate({
      category: "strength",
      durationMinutes: 60,
      exercises: [],
    });

    assert.ok(result.error);
  });

  test("rejects an invalid category", () => {
    const result = validate({
      title: "Push Day",
      category: "invalid",
      durationMinutes: 60,
      exercises: [],
    });

    assert.ok(result.error);
  });

  test("rejects duration below minimum", () => {
    const result = validate({
      title: "Push Day",
      category: "strength",
      durationMinutes: 0,
      exercises: [],
    });

    assert.ok(result.error);
  });

  test("rejects invalid sets", () => {
    const result = validate({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439011",
          sets: 0,
          reps: 10,
          kg: 80,
        },
      ],
    });

    assert.ok(result.error);
  });

  test("rejects invalid reps", () => {
    const result = validate({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439011",
          sets: 4,
          reps: 0,
          kg: 80,
        },
      ],
    });

    assert.ok(result.error);
  });

  test("rejects invalid kg", () => {
    const result = validate({
      title: "Push Day",
      category: "strength",
      durationMinutes: 60,
      exercises: [
        {
          exercise: "507f1f77bcf86cd799439011",
          sets: 4,
          reps: 10,
          kg: -5,
        },
      ],
    });

    assert.ok(result.error);
  });
});
