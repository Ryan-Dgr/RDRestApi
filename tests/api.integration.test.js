process.env.JWT_PRIVATE_KEY = "test_private_key";

const { describe, test, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const app = require("../app");
const { User } = require("../models/user");
const Exercise = require("../models/exercise");
const Workout = require("../models/workout");
const WorkoutLog = require("../models/workoutLog");

let server;
let baseUrl;
let userToken;
let adminToken;
let userId;
let exerciseId;
let secondExerciseId;
let unusedExerciseId;
let workoutId;
let workoutLogId;
let workoutLogExerciseEntryId;
const unique = Date.now();
const normalEmail = `normal.${unique}@integrationtest.com`;
const adminEmail = `admin.${unique}@integrationtest.com`;

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

describe("API integration", { concurrency: false }, () => {
  before(async () => {
    const mongoUri = process.env.MONGODB_URI_TEST;

    if (!mongoUri) {
      throw new Error("MONGODB_URI_TEST is not defined.");
    }

    await mongoose.connect(mongoUri);
    await mongoose.connection.dropDatabase();

    server = app.listen(0);
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  test("does not allow a user to self-admin during registration", async () => {
    const response = await request("/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "Normal User",
        email: normalEmail,
        password: "password123",
        isAdmin: true,
      }),
    });

    assert.strictEqual(response.status, 400);
  });

  test("registers a normal user", async () => {
    const response = await request("/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "Normal User",
        email: normalEmail,
        password: "password123",
      }),
    });

    assert.strictEqual(response.status, 200);

    userToken = response.headers.get("x-auth-token");

    const body = await response.json();
    userId = body._id;

    const user = await User.findById(userId);

    assert.strictEqual(user.isAdmin, false);
    assert.ok(userToken);
  });

  test("logs in a user", async () => {
    const response = await request("/api/auth", {
      method: "POST",
      body: JSON.stringify({
        email: normalEmail,
        password: "password123",
      }),
    });

    assert.strictEqual(response.status, 200);

    const token = await response.text();

    assert.ok(token);
  });

  test("returns current user with valid token", async () => {
    const response = await request("/api/users/me", {
      headers: {
        "x-auth-token": userToken,
      },
    });

    assert.strictEqual(response.status, 200);

    const body = await response.json();

    assert.strictEqual(body.email, normalEmail);
    assert.strictEqual(body.password, undefined);
  });

  test("creates an admin token for admin-only routes", async () => {
    const admin = new User({
      name: "Admin User",
      email: adminEmail,
      password: "password123",
      isAdmin: true,
    });

    await admin.save();

    adminToken = admin.generateAuthToken();

    assert.ok(adminToken);
  });

  test("does not allow a normal user to create an exercise", async () => {
    const response = await request("/api/exercises", {
      method: "POST",
      headers: {
        "x-auth-token": userToken,
      },
      body: JSON.stringify({
        name: "Bench Press",
        muscleGroup: "chest",
        equipment: "barbell",
      }),
    });

    assert.strictEqual(response.status, 403);
  });

  test("creates an exercise with admin token", async () => {
    const response = await request("/api/exercises", {
      method: "POST",
      headers: {
        "x-auth-token": adminToken,
      },
      body: JSON.stringify({
        name: "Bench Press",
        muscleGroup: "chest",
        equipment: "barbell",
      }),
    });

    assert.strictEqual(response.status, 201);

    const body = await response.json();
    exerciseId = body._id;

    assert.strictEqual(body.name, "Bench Press");
  });

  test("creates a second exercise with admin token", async () => {
    const response = await request("/api/exercises", {
      method: "POST",
      headers: {
        "x-auth-token": adminToken,
      },
      body: JSON.stringify({
        name: "Cable Row",
        muscleGroup: "back",
        equipment: "cable",
      }),
    });

    assert.strictEqual(response.status, 201);

    const body = await response.json();
    secondExerciseId = body._id;

    assert.strictEqual(body.name, "Cable Row");
  });

  test("creates an unused exercise", async () => {
    const response = await request("/api/exercises", {
      method: "POST",
      headers: {
        "x-auth-token": adminToken,
      },
      body: JSON.stringify({
        name: "Bodyweight Squat",
        muscleGroup: "legs",
        equipment: "bodyweight",
      }),
    });

    assert.strictEqual(response.status, 201);

    const body = await response.json();
    unusedExerciseId = body._id;
  });

  test("creates a workout with exercise ids", async () => {
    const response = await request("/api/workouts", {
      method: "POST",
      headers: {
        "x-auth-token": userToken,
      },
      body: JSON.stringify({
        title: "Push Day",
        category: "strength",
        durationMinutes: 75,
        exercises: [exerciseId],
      }),
    });

    assert.strictEqual(response.status, 201);

    const body = await response.json();
    workoutId = body._id;

    assert.deepStrictEqual(body.exercises, [exerciseId]);
  });

  test("adds an exercise to a workout", async () => {
    const response = await request(`/api/workouts/${workoutId}/exercises`, {
      method: "POST",
      headers: {
        "x-auth-token": userToken,
      },
      body: JSON.stringify({
        exerciseId: secondExerciseId,
      }),
    });

    assert.strictEqual(response.status, 201);

    const body = await response.json();

    assert.strictEqual(body.exercises.length, 2);
    assert.ok(body.exercises.includes(secondExerciseId));
  });

  test("creates a workout log", async () => {
    const response = await request("/api/workout-logs", {
      method: "POST",
      headers: {
        "x-auth-token": userToken,
      },
      body: JSON.stringify({
        workout: workoutId,
        notes: "Strong push session.",
      }),
    });

    assert.strictEqual(response.status, 201);

    const body = await response.json();
    workoutLogId = body._id;
    workoutLogExerciseEntryId = body.exercises[0]._id;

    assert.strictEqual(body.notes, "Strong push session.");
    assert.strictEqual(body.exercises.length, 2);
    assert.strictEqual(body.exercises[0].sets.length, 0);
  });

  test("adds a set to a workout log exercise", async () => {
    const response = await request(
      `/api/workout-logs/${workoutLogId}/exercises/${workoutLogExerciseEntryId}/sets`,
      {
        method: "POST",
        headers: {
          "x-auth-token": userToken,
        },
        body: JSON.stringify({
          reps: 8,
          kg: 80,
          type: "normal",
        }),
      },
    );

    assert.strictEqual(response.status, 201);

    const body = await response.json();
    const loggedExercise = body.exercises.find(
      (item) => item._id === workoutLogExerciseEntryId,
    );

    assert.strictEqual(loggedExercise.sets.length, 1);
    assert.strictEqual(loggedExercise.sets[0].reps, 8);
    assert.strictEqual(loggedExercise.sets[0].kg, 80);
    assert.strictEqual(loggedExercise.sets[0].type, "normal");
  });

  test("gets current user's workout logs", async () => {
    const response = await request("/api/workout-logs", {
      headers: {
        "x-auth-token": userToken,
      },
    });

    assert.strictEqual(response.status, 200);

    const body = await response.json();

    assert.strictEqual(body.length, 1);
    assert.strictEqual(body[0]._id, workoutLogId);
  });

  test("does not allow normal user to delete a workout", async () => {
    const response = await request(`/api/workouts/${workoutId}`, {
      method: "DELETE",
      headers: {
        "x-auth-token": userToken,
      },
    });

    assert.strictEqual(response.status, 403);
  });

  test("does not delete workout while it is used in a workout log", async () => {
    const response = await request(`/api/workouts/${workoutId}`, {
      method: "DELETE",
      headers: {
        "x-auth-token": adminToken,
      },
    });

    assert.strictEqual(response.status, 400);
  });

  test("does not delete exercise while it is used in a workout or workout log", async () => {
    const response = await request(`/api/exercises/${exerciseId}`, {
      method: "DELETE",
      headers: {
        "x-auth-token": adminToken,
      },
    });

    assert.strictEqual(response.status, 400);
  });

  test("deletes an unused exercise with admin token", async () => {
    const response = await request(`/api/exercises/${unusedExerciseId}`, {
      method: "DELETE",
      headers: {
        "x-auth-token": adminToken,
      },
    });

    assert.strictEqual(response.status, 200);

    const deletedExercise = await Exercise.findById(unusedExerciseId);

    assert.strictEqual(deletedExercise, null);
  });

  test("deletes a workout log", async () => {
    const response = await request(`/api/workout-logs/${workoutLogId}`, {
      method: "DELETE",
      headers: {
        "x-auth-token": userToken,
      },
    });

    assert.strictEqual(response.status, 200);

    const deletedLog = await WorkoutLog.findById(workoutLogId);

    assert.strictEqual(deletedLog, null);
  });

  test("deletes workout with admin token after log is removed", async () => {
    const response = await request(`/api/workouts/${workoutId}`, {
      method: "DELETE",
      headers: {
        "x-auth-token": adminToken,
      },
    });

    assert.strictEqual(response.status, 200);

    const deletedWorkout = await Workout.findById(workoutId);

    assert.strictEqual(deletedWorkout, null);
  });
});
