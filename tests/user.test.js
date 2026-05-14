const { describe, test } = require("node:test");
const assert = require("node:assert");
const { validate } = require("../models/user");

describe("User validation", () => {
  test("accepts a valid user", () => {
    const result = validate({
      name: "Ryan",
      email: "ryan@test.com",
      password: "password123",
    });

    assert.strictEqual(result.error, undefined);
  });

  test("rejects an invalid email", () => {
    const result = validate({
      name: "Ryan",
      email: "not-an-email",
      password: "password123",
    });

    assert.ok(result.error);
    assert.strictEqual(result.error.details[0].path[0], "email");
  });

  test("rejects a password that is too short", () => {
    const result = validate({
      name: "Ryan",
      email: "ryan@test.com",
      password: "123",
    });

    assert.ok(result.error);
    assert.strictEqual(result.error.details[0].path[0], "password");
  });
});
