const { describe, test } = require("node:test");
const assert = require("node:assert");
const admin = require("../middleware/admin");

describe("Admin middleware", () => {
  test("returns 403 when user is not admin", () => {
    const req = {
      user: {
        isAdmin: false,
      },
    };

    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      send(message) {
        this.body = message;
        return this;
      },
    };

    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    admin(req, res, next);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(nextCalled, false);
  });

  test("calls next when user is admin", () => {
    const req = {
      user: {
        isAdmin: true,
      },
    };

    const res = {};

    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    admin(req, res, next);

    assert.strictEqual(nextCalled, true);
  });
});
