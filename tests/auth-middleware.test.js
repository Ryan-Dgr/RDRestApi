process.env.JWT_PRIVATE_KEY = "test_private_key";

const { describe, test } = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../middleware/auth");

describe("Auth middleware", () => {
  test("returns 401 when no token is provided", () => {
    const req = {
      header() {
        return null;
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

    auth(req, res, next);

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(nextCalled, false);
  });

  test("returns 400 when token is invalid", () => {
    const req = {
      header() {
        return "invalid-token";
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

    auth(req, res, next);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(nextCalled, false);
  });

  test("sets req.user and calls next when token is valid", () => {
    const token = jwt.sign(
      { _id: "507f1f77bcf86cd799439011", isAdmin: false },
      config.get("jwtPrivateKey"),
    );

    const req = {
      user: null,
      header() {
        return token;
      },
    };

    const res = {};

    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    auth(req, res, next);

    assert.strictEqual(req.user._id, "507f1f77bcf86cd799439011");
    assert.strictEqual(req.user.isAdmin, false);
    assert.strictEqual(nextCalled, true);
  });
});
