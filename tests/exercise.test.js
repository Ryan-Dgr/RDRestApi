const { describe, test } = require("node:test");
const assert = require("node:assert");
const { validate } = require("../models/exercise");

describe("Exercise validation", () => {
  test("accepts a valid exercise", () => {
    const result = validate({
      name: "Bench Press",
      muscleGroup: "chest",
      equipment: "barbell",
    });

    assert.strictEqual(result.error, undefined);
  });

  test("rejects an invalid muscle group", () => {
    const result = validate({
      name: "Bench Press",
      muscleGroup: "invalid",
      equipment: "barbell",
    });

    assert.ok(result.error);
  });

  test("rejects an invalid equipment type", () => {
    const result = validate({
      name: "Bench Press",
      muscleGroup: "chest",
      equipment: "invalid",
    });

    assert.ok(result.error);
  });

  test("rejects an exercise without a name", () => {
    const result = validate({
      muscleGroup: "chest",
      equipment: "barbell",
    });

    assert.ok(result.error);
  });
});
