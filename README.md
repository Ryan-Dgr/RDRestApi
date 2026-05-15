# Workout REST API

Node.js REST API for managing exercises, workout templates, workout sets and logged workout sessions.

## Links

- Live API URL: `TODO - add after deployment`
- Complete API documentation: [API Documentation](#api-documentation)

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- Joi
- JWT
- bcrypt
- Node.js built-in test runner
- REST Client test file

## Features

- JWT authentication with expiring tokens
- Role-based authorization with normal users and admins
- Exercise management
- Workout templates with embedded sets
- Workout logs linked to users, workouts and exercises
- Input validation with Joi and Mongoose
- ObjectId validation before MongoDB reads/writes
- Central error middleware
- Unit tests and integration tests

## Data Model

The API uses 4 linked MongoDB collections:

| Collection | Purpose | Relations |
|---|---|---|
| `users` | Registered API users | Linked from `workoutlogs` |
| `exercises` | Exercise library | Linked from `workouts` and `workoutlogs` |
| `workouts` | Workout templates | References exercises |
| `workoutlogs` | Performed workout sessions | References users, workouts and exercises |

### Embedding vs References

Embedded documents are used for sets because sets only make sense inside a workout or workout log.

References are used for:

- `Workout -> Exercise`, because exercises are reusable library items.
- `WorkoutLog -> User`, because logs belong to a specific user.
- `WorkoutLog -> Workout`, because a log is based on a workout template.
- `WorkoutLog -> Exercise`, because logged exercises should still point to the exercise library.

## Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/workout-api
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/rdrestapi_test
JWT_PRIVATE_KEY=your_private_jwt_key
```

Do not commit `.env` to GitHub.

## Installation

```bash
npm install
```

## Running The App

```bash
npm start
```

The API runs by default on:

```txt
http://localhost:3000
```

## Testing

Run all automated tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

This project includes:

- model validation tests
- middleware tests
- authentication tests
- integration tests for the main API flow

Manual API requests are available in:

```txt
test.http
```

Use the REST Client extension in VS Code to run these requests.

## Authentication

The API uses JWT authentication.

Send the token in this header:

```http
x-auth-token: your-token-here
```

Tokens expire after 1 hour.

Users cannot make themselves admin during registration. The first admin must be created manually in MongoDB or by a safe seed/admin setup. Admin-only routes require both authentication and admin authorization.

## API Documentation

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Check if the API is running |

### Home

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | No | Render home page |

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth` | No | Login and receive JWT |

Example body:

```json
{
  "email": "normal.user@example.com",
  "password": "password123"
}
```

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users` | No | Register user |
| GET | `/api/users/me` | User | Get current user |
| PATCH | `/api/users/:id/role` | Admin | Update user admin role |

Register body:

```json
{
  "name": "Normal User",
  "email": "normal.user@example.com",
  "password": "password123"
}
```

Update role body:

```json
{
  "isAdmin": true
}
```

### Exercises

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/exercises` | No | Get all exercises |
| GET | `/api/exercises/:id` | No | Get exercise by id |
| POST | `/api/exercises` | User | Create exercise |
| PUT | `/api/exercises/:id` | User | Update exercise |
| DELETE | `/api/exercises/:id` | Admin | Delete exercise |

Exercise body:

```json
{
  "name": "Bench Press",
  "muscleGroup": "chest",
  "equipment": "barbell"
}
```

Allowed `muscleGroup` values:

```txt
chest, back, legs, shoulders, arms, core, full body
```

Allowed `equipment` values:

```txt
barbell, dumbbell, machine, bodyweight, cable, kettlebell
```

### Workouts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/workouts` | No | Get all workouts |
| GET | `/api/workouts/:id` | No | Get workout by id |
| POST | `/api/workouts` | User | Create workout |
| POST | `/api/workouts/:id/exercises` | User | Add exercise to workout |
| POST | `/api/workouts/:workoutId/exercises/:exerciseEntryId/sets` | User | Add set to workout exercise |
| PUT | `/api/workouts/:id` | User | Update workout |
| DELETE | `/api/workouts/:id` | Admin | Delete workout |

Workout body:

```json
{
  "title": "Push Day",
  "category": "strength",
  "durationMinutes": 75,
  "exercises": [
    {
      "exercise": "exerciseId",
      "sets": [
        {
          "reps": 10,
          "kg": 60,
          "type": "warmup"
        },
        {
          "reps": 8,
          "kg": 80,
          "type": "normal"
        }
      ]
    }
  ]
}
```

Allowed workout categories:

```txt
strength, cardio
```

Allowed set types:

```txt
warmup, normal, dropset
```

### Workout Logs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/workout-logs` | User | Get current user's workout logs |
| GET | `/api/workout-logs/:id` | User | Get workout log by id |
| POST | `/api/workout-logs` | User | Create workout log |
| PUT | `/api/workout-logs/:id` | User | Update workout log |
| DELETE | `/api/workout-logs/:id` | User | Delete workout log |

Workout log body:

```json
{
  "workout": "workoutId",
  "notes": "Strong push session.",
  "exercises": [
    {
      "exercise": "exerciseId",
      "sets": [
        {
          "reps": 10,
          "kg": 60,
          "type": "warmup"
        },
        {
          "reps": 8,
          "kg": 80,
          "type": "normal"
        }
      ]
    }
  ]
}
```

## Deployment Guide

This guide uses Render and MongoDB Atlas.

### 1. Prepare MongoDB Atlas

1. Create a free MongoDB Atlas account.
2. Create a cluster.
3. Create a database user.
4. Allow network access from your deployment provider.
5. Copy the connection string.

Example connection string format:

```txt
mongodb+srv://username:password@cluster.mongodb.net/workout-api
```

### 2. Push Code To GitHub

```bash
git add .
git commit -m "prepare API for deployment"
git push
```

### 3. Create Render Web Service

1. Go to Render.
2. Create a new Web Service.
3. Connect your GitHub repository.
4. Use these settings:

| Setting | Value |
|---|---|
| Environment | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |

### 4. Add Environment Variables On Render

Add:

```txt
MONGODB_URI=your_atlas_connection_string
JWT_PRIVATE_KEY=your_production_jwt_secret
NODE_ENV=production
```

Render sets `PORT` automatically, so the app uses:

```js
process.env.PORT || 3000
```

### 5. Deploy And Test

After deployment, test:

```txt
GET https://your-api.onrender.com/health
GET https://your-api.onrender.com/api/exercises
```

Then update the README links:

```md
- Live API URL: https://your-api.onrender.com
- Complete API documentation: https://your-api.onrender.com or README/API docs link
```

## Project Requirements Checklist

- Express API with at least 17 endpoints
- 4 linked collections
- MongoDB and Mongoose
- Embedded documents for sets
- JWT authentication and authorization
- Expiring JWT tokens
- Environment variables for secrets and connection strings
- Input validation
- ObjectId validation
- Error middleware
- Unit tests
- Integration tests
- REST Client file
- Deployment guide

