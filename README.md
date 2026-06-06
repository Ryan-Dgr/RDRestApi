# Workout REST API

Dit project is een Node.js REST API voor het beheren van oefeningen, workout templates en uitgevoerde workout sessies. De API bevat authenticatie met JWT, rollen voor gewone gebruikers en admins, modelvalidatie met Mongoose, request-validatie met Joi en een geautomatiseerde test suite.

Gebruikers kunnen workouts samenstellen op basis van herbruikbare oefeningen. Wanneer een gebruiker een workout uitvoert, wordt er een workout log aangemaakt waarin de oefeningen uit de template worden overgenomen. Sets, herhalingen en gewicht horen bij die concrete workout log.

> Projectstatus: klaar voor deploymentvoorbereiding.
> De models, routes, REST Client requests en tests zijn op elkaar afgestemd volgens de huidige datamodelkeuze: workouts bevatten alleen exercise references; sets worden bijgehouden in workout logs.

---

## Links

- Lokale API URL: `http://localhost:3000`
- Azure API URL: `https://workout-api-ryan-ace2grfeheaxbtf7.francecentral-01.azurewebsites.net/`
- Lokale Swagger UI: `http://localhost:3000/api-docs/`
- Azure Swagger UI: `https://workout-api-ryan-ace2grfeheaxbtf7.francecentral-01.azurewebsites.net/api-docs/`
- Health check: `/health`
- Manuele requests: `test.http`

---

## Functionaliteiten

- JWT authenticatie met tokens die na 1 uur verlopen.
- Role-based authorization met gewone gebruikers en admins.
- Admin-only beheer van de exercise library.
- Admin-only beheer van workout templates.
- Publieke read endpoints voor oefeningen en workout templates.
- Workout templates met title, category, duration en exercise references.
- Persoonlijke workout logs per gebruiker.
- Sets per oefening binnen een workout log.
- ObjectId-controle voor MongoDB reads en writes.
- Joi-validatie aan de API-laag en Mongoose-validatie aan de database-laag.
- Centrale async/error middleware.
- Unit tests, middleware tests en integratietests.
- REST Client bestand voor manuele API-controle.

---

## Technologie Stack

- Backend: Node.js en Express
- Database: MongoDB
- ODM: Mongoose
- Validatie: Joi
- Authenticatie: JWT
- Password hashing: bcrypt
- Security middleware: Helmet
- Logging in development: Morgan
- Configuratie: dotenv en config
- View engine voor home page: Pug
- Testing: Node.js built-in test runner
- Manuele API requests: REST Client via `test.http`
- API documentatie: Swagger UI met `swagger-ui-express` en OpenAPI YAML via `yamljs`

---

## Systeem Architectuur & Modellen

De API volgt de Vives-structuur met aparte mappen voor `models/`, `routes/` en `middleware/`. De validatie gebeurt in twee lagen:

- Joi valideert request bodies voor ze naar de database gaan.
- Mongoose bewaakt de uiteindelijke structuur en constraints van de documenten.

De functionele logica draait rond vier kernmodellen:

| Model      | Bestand                | Doel                                                                      |
| ---------- | ---------------------- | ------------------------------------------------------------------------- |
| User       | `models/user.js`       | Beheert gebruikers, wachtwoorden, adminrol en JWT-generatie.              |
| Exercise   | `models/exercise.js`   | Centrale exercise library met naam, spiergroep en materiaal.              |
| Workout    | `models/workout.js`    | Workout template met titel, categorie, duur en references naar exercises. |
| WorkoutLog | `models/workoutLog.js` | Persoonlijke uitgevoerde workout met user, workout, oefeningen en sets.   |

### References vs Embedded Documents

References worden gebruikt wanneer data herbruikbaar is of op zichzelf betekenis heeft:

- `Workout -> Exercise`, omdat oefeningen opnieuw gebruikt kunnen worden in meerdere workouts.
- `WorkoutLog -> User`, omdat logs eigendom zijn van een gebruiker.
- `WorkoutLog -> Workout`, omdat een log gebaseerd is op een workout template.
- `WorkoutLog -> Exercise`, omdat gelogde oefeningen nog verwijzen naar de exercise library.

Embedded documents worden gebruikt voor data die alleen binnen een groter document betekenis heeft:

- Sets zitten embedded in `WorkoutLog.exercises[].sets`.
- Sets zitten niet in `Workout`, omdat een workout alleen de template is.

---

## Middleware Architectuur

De API gebruikt een kleine middleware-stack die routes leesbaar houdt en fouten centraal afhandelt.

| Middleware    | Bestand               | Doel                                                                 |
| ------------- | --------------------- | -------------------------------------------------------------------- |
| Auth          | `middleware/auth.js`  | Controleert het JWT-token in de `x-auth-token` header.               |
| Admin         | `middleware/admin.js` | Beperkt bepaalde routes tot users met `isAdmin: true`.               |
| Async wrapper | `middleware/async.js` | Vangt async route errors op en stuurt ze door naar error middleware. |
| Error handler | `middleware/error.js` | Centrale catch-all voor server errors met nette response.            |
| Helmet        | `app.js`              | Zet beveiligende HTTP headers.                                       |
| Morgan        | `app.js`              | Logt HTTP requests in development mode.                              |

ObjectId-validatie gebeurt momenteel met lokale helperfuncties in de routes. Dat past bij de huidige projectgrootte en houdt de flow eenvoudig te volgen.

---

## Lokale Installatie & Opstart

### 1. Vereisten

Zorg dat deze tools geinstalleerd zijn:

- Node.js
- npm
- MongoDB lokaal, of een MongoDB connection string via Atlas/Cosmos DB

### 2. Dependencies installeren

```bash
npm install
```

### 3. Environment variables instellen

Maak een `.env` bestand aan in de root van het project, naast `package.json`.

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/workout-api
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/rdrestapi_test
JWT_PRIVATE_KEY=your_private_jwt_key
```

Belangrijk:

- Commit `.env` nooit naar GitHub.
- `MONGODB_URI_TEST` wordt gebruikt door de integratietests.
- `JWT_PRIVATE_KEY` is verplicht. Zonder deze waarde stopt de applicatie bij het opstarten.

### 4. Server starten

```bash
npm start
```

De API draait standaard op:

```txt
http://localhost:3000
```

Controleer de server met:

```txt
GET http://localhost:3000/health
```

---

## Tests

Alle tests uitvoeren:

```bash
npm test
```

Tests met coverage uitvoeren:

```bash
npm run test:coverage
```

De test suite bevat:

- model validation tests
- middleware tests
- authentication tests
- integratietests voor de volledige API-flow

Manuele requests staan in:

```txt
test.http
```

Gebruik hiervoor de REST Client extension in VS Code.

---

## Authenticatie & Rollen

De API gebruikt JWT authenticatie. Beschermde routes verwachten de token in deze header:

```http
x-auth-token: your-token-here
```

Een nieuwe gebruiker registreren kan via `POST /api/users`. De API geeft dan ook een token terug in de `x-auth-token` response header.

Inloggen kan via `POST /api/auth`. Deze route geeft de token terug in de response body.

Gebruikers kunnen zichzelf niet admin maken tijdens registratie. De eerste admin moet eenmalig veilig aangemaakt worden via MongoDB of via een bestaand admin-account. Daarna kan een admin de rol van andere users aanpassen via `PATCH /api/users/:id/role`.

Admins beheren de centrale exercise library en workout templates. Gewone gebruikers kunnen deze templates bekijken en starten daarna een persoonlijke workout log op basis van een gekozen workout.

---

## API Overzicht

### Health & Home

| Method | Endpoint  | Auth | Doel                          |
| ------ | --------- | ---- | ----------------------------- |
| GET    | `/`       | Nee  | Rendert de Pug home page.     |
| GET    | `/health` | Nee  | Controleert of de API draait. |

### Auth

| Method | Endpoint    | Auth | Doel                    |
| ------ | ----------- | ---- | ----------------------- |
| POST   | `/api/auth` | Nee  | Login en JWT ontvangen. |

Login body:

```json
{
  "email": "normal.user@example.com",
  "password": "password123"
}
```

### Users

| Method | Endpoint              | Auth  | Doel                                         |
| ------ | --------------------- | ----- | -------------------------------------------- |
| POST   | `/api/users`          | Nee   | Nieuwe gebruiker registreren.                |
| GET    | `/api/users/me`       | User  | Ingelogde gebruiker ophalen zonder password. |
| PATCH  | `/api/users/:id/role` | Admin | Adminrol van een gebruiker aanpassen.        |

Register body:

```json
{
  "name": "Normal User",
  "email": "normal.user@example.com",
  "password": "password123"
}
```

Role update body:

```json
{
  "isAdmin": true
}
```

### Exercises

| Method | Endpoint             | Auth  | Doel                                                |
| ------ | -------------------- | ----- | --------------------------------------------------- |
| GET    | `/api/exercises`     | Nee   | Alle oefeningen ophalen.                            |
| GET    | `/api/exercises/:id` | Nee   | Oefening ophalen op id.                             |
| POST   | `/api/exercises`     | Admin | Oefening aanmaken.                                  |
| PUT    | `/api/exercises/:id` | Admin | Oefening aanpassen.                                 |
| DELETE | `/api/exercises/:id` | Admin | Oefening verwijderen als ze nergens gebruikt wordt. |

Exercise body:

```json
{
  "name": "Bench Press",
  "muscleGroup": "chest",
  "equipment": "barbell"
}
```

Toegelaten `muscleGroup` waarden:

```txt
chest, back, legs, shoulders, arms, core, full body
```

Toegelaten `equipment` waarden:

```txt
barbell, dumbbell, machine, bodyweight, cable, kettlebell
```

### Workouts

| Method | Endpoint                                         | Auth  | Doel                                                       |
| ------ | ------------------------------------------------ | ----- | ---------------------------------------------------------- |
| GET    | `/api/workouts`                                  | Nee   | Alle workout templates ophalen.                            |
| GET    | `/api/workouts/:id`                              | Nee   | Workout template ophalen op id.                            |
| POST   | `/api/workouts`                                  | Admin | Workout template aanmaken.                                 |
| PUT    | `/api/workouts/:id`                              | Admin | Workout template aanpassen.                                |
| POST   | `/api/workouts/:workoutId/exercises`             | Admin | Exercise toevoegen aan workout.                            |
| DELETE | `/api/workouts/:workoutId/exercises/:exerciseId` | Admin | Exercise verwijderen uit workout.                          |
| DELETE | `/api/workouts/:id`                              | Admin | Workout verwijderen als ze niet gebruikt wordt in een log. |

Workout body:

```json
{
  "title": "Push Day",
  "category": "strength",
  "durationMinutes": 75,
  "exercises": ["exerciseId"]
}
```

Exercise toevoegen aan workout:

```json
{
  "exerciseId": "exerciseId"
}
```

Toegelaten workout categories:

```txt
strength, cardio
```

### Workout Logs

| Method | Endpoint                                                          | Auth | Doel                                                 |
| ------ | ----------------------------------------------------------------- | ---- | ---------------------------------------------------- |
| GET    | `/api/workout-logs`                                               | User | Workout logs van de ingelogde gebruiker ophalen.     |
| GET    | `/api/workout-logs/:id`                                           | User | Een eigen workout log ophalen.                       |
| POST   | `/api/workout-logs`                                               | User | Nieuwe workout log starten op basis van een workout. |
| POST   | `/api/workout-logs/:logId/exercises/:exerciseEntryId/sets`        | User | Set toevoegen aan een oefening in een log.           |
| PUT    | `/api/workout-logs/:logId/exercises/:exerciseEntryId/sets/:setId` | User | Set aanpassen.                                       |
| DELETE | `/api/workout-logs/:logId/exercises/:exerciseEntryId/sets/:setId` | User | Set verwijderen.                                     |
| DELETE | `/api/workout-logs/:id`                                           | User | Eigen workout log verwijderen.                       |

Workout log starten:

```json
{
  "workout": "workoutId",
  "notes": "Strong push session."
}
```

De server kopieert de exercises uit de workout naar de workout log. Elke exercise entry start met `sets: []`.

Set body:

```json
{
  "reps": 8,
  "kg": 80,
  "type": "normal"
}
```

Toegelaten set types:

```txt
warmup, normal, dropset
```

---

## Azure Deployment

De geplande deployment gebeurt via Azure. De eenvoudigste productieopstelling voor dit project is:

- Azure App Service voor de Node.js API.
- MongoDB Atlas of Azure Cosmos DB for MongoDB als managed database.
- Azure App Service Configuration voor environment variables.
- GitHub of Azure deployment center voor automatische deployment vanuit de repository.

### 1. Database voorzien

Kies een MongoDB-compatible database en kopieer de connection string.

Mogelijke opties:

- MongoDB Atlas
- Azure Cosmos DB for MongoDB

De API verwacht deze connection string in:

```txt
MONGODB_URI
```

### 2. Azure App Service aanmaken

Maak in Azure een App Service aan met een Node.js runtime. Gebruik voor productie minstens deze instellingen:

| Setting       | Waarde        |
| ------------- | ------------- |
| Runtime stack | Node.js       |
| Start command | `npm start`   |
| Build command | `npm install` |
| Environment   | Production    |

### 3. App settings toevoegen

Voeg in Azure App Service deze environment variables toe:

```txt
MONGODB_URI=your_production_mongodb_connection_string
JWT_PRIVATE_KEY=your_production_jwt_secret
NODE_ENV=production
```

Azure voorziet zelf een poort voor de applicatie. De code gebruikt daarom:

```js
process.env.PORT || 3000;
```

### 4. Deployen en testen

Na deployment moeten minstens deze endpoints werken:

```txt
GET https://your-app-name.azurewebsites.net/health
GET https://your-app-name.azurewebsites.net/api/exercises
```

Daarna kunnen de links bovenaan deze README worden aangevuld met de echte Azure URL.

---

## Project Checklist

- Express REST API
- Minstens 17 endpoints
- 4 gelinkte MongoDB collections
- Mongoose schemas en validatie
- Joi request-validatie
- References tussen collections
- Embedded subdocuments voor workout log sets
- JWT authenticatie
- Role-based authorization met admin routes
- Expiring JWT tokens
- Environment variables voor secrets en database config
- ObjectId validatie
- Centrale error middleware
- Unit tests
- Integratietests
- REST Client bestand
- Azure deploymentplan
