# AirSafe Server

Node.js and Express REST API for **AirSafe**, providing real-time air pollution integration, personalized exposure calculations, route comparisons, location search, and user session management with MongoDB Atlas.

---

## 1. Overview & Responsibilities

The AirSafe server serves as the core computational engine and persistence backend:
- **Live Air Quality Data**: Fetches and caches meteorological pollution metrics from the OpenWeather Air Pollution API with strict timeouts and error boundaries.
- **EPA AQI Calculation**: Computes accurate US EPA piecewise linear Air Quality Index values and dominant pollutants from raw mass concentrations ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{O}_3$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$).
- **Exposure Dose Engine**: Calculates individualized outdoor exposure scores (0–100) based on physical metabolic exertion and breathing rates across different activities.
- **Route Corridor Comparison**: Analyzes transit corridors between geographic coordinates to recommend lower-pollution "Green Corridors".
- **Google Authentication & Sessions**: Verifies Google Identity Services ID tokens, manages user profiles in MongoDB Atlas, and issues secure HTTP-only session cookies.
- **Location Geocoding**: Provides fast location search and coordinate resolution.

---

## 2. Technology Stack & Dependencies

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | [Node.js 22](https://nodejs.org/) (Alpine) | Server execution environment |
| **Framework** | [Express 4.19](https://expressjs.com/) | REST API routing and middleware pipeline |
| **Database ODM** | [Mongoose 9.11](https://mongoosejs.com/) | MongoDB Atlas object modeling and schema validation |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Document database (database: `airsafe`) |
| **Authentication** | [google-auth-library 11.2](https://github.com/googleapis/google-auth-library-nodejs) | Cryptographic Google ID token verification |
| **Security & Utilities** | `cookie-parser 1.4`, `cors 2.8`, `dotenv 16.4` | HTTP-only session cookies, CORS headers, environment management |
| **Testing** | [Jest 29.7](https://jestjs.io/) & [Supertest 7.0](https://github.com/ladjs/supertest) | Offline unit and integration test suite |

---

## 3. Directory Structure

```text
server/
├── src/
│   ├── app.js                 # Express application factory and middleware configuration
│   ├── server.js              # Server entrypoint: DB connection, HTTP listen, graceful shutdown
│   ├── config/
│   │   ├── db.js              # MongoDB Atlas connection manager (connectDB, disconnectDB)
│   │   └── env.js             # Environment variable validation and frozen export
│   ├── controllers/
│   │   ├── air.controller.js            # Air quality and forecast endpoints
│   │   ├── auth.controller.js           # Google login, session restoration, logout
│   │   ├── exposure.controller.js       # Exposure score calculation and history retrieval
│   │   ├── geo.controller.js            # Location geocoding search
│   │   ├── health.controller.js         # Process health status
│   │   ├── recommendation.controller.js # Health advisories and cleanest time windows
│   │   └── route.controller.js          # Pollution-aware route comparison
│   ├── middleware/
│   │   ├── auth.middleware.js           # requireAuth and optionalAuth session guards
│   │   └── errorHandler.js              # 404 handler and central JSON error boundary
│   ├── models/
│   │   ├── exposureRecord.model.js      # Schema for calculated exposure events
│   │   ├── session.model.js             # Server-side sessions with TTL expiration
│   │   └── user.model.js                # Google user profiles and preferences
│   ├── routes/
│   │   ├── air.routes.js                # /api/air
│   │   ├── auth.routes.js               # /api/auth
│   │   ├── exposure.routes.js           # /api/exposure
│   │   ├── geo.routes.js                # /api/geo
│   │   ├── health.routes.js             # /api/health
│   │   ├── recommendation.routes.js     # /api/recommendations
│   │   └── route.routes.js              # /api/routes
│   ├── services/
│   │   ├── exposure.service.js          # Exposure scoring business logic
│   │   ├── geocoding.service.js         # Location search service
│   │   ├── googleAuth.service.js        # Google OAuth token verification
│   │   ├── openweather.service.js       # OpenWeather API client with 5s timeout & resilience
│   │   ├── recommendation.service.js    # AQI advisory rules and clean window analysis
│   │   └── route.service.js             # Corridor waypoints and exposure delta estimation
│   └── utils/
│       ├── aqiCalculator.js             # US EPA piecewise linear AQI calculation formulas
│       ├── cookie.js                    # HTTP-only session cookie issuance and parsing
│       └── exposureCalculator.js        # Metabolic ventilation rates and dose formulas
├── tests/
│   ├── setup.js               # Global test environment variables & fetch mock defaults
│   ├── air.test.js            # /api/air endpoints integration tests
│   ├── aqiCalculator.test.js  # EPA AQI mathematical formulas unit tests
│   ├── auth.test.js           # Google authentication and session lifecycle tests
│   ├── db.test.js             # MongoDB connection and failure handling tests
│   ├── exposure.test.js       # Exposure calculation and history integration tests
│   ├── exposureCalculator.test.js # Activity ventilation multiplier unit tests
│   ├── geo.test.js            # Geocoding search endpoint tests
│   ├── health.test.js         # Health check endpoint tests
│   ├── recommendation.test.js # Advisory and clean window tests
│   ├── route.test.js          # Route comparison corridor tests
│   └── server.test.js         # Startup, DB readiness, and shutdown signal tests
├── .dockerignore              # Exclusions for container builds
├── .env.example               # Environment variable configuration template
├── Dockerfile                 # Production Docker build (Node 22 Alpine)
└── package.json               # Dependencies and scripts
```

---

## 4. Environment Variables

Create a `.env` file inside the `server/` directory:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux (Bash):**
```bash
cp .env.example .env
```

### Configuration Parameters

| Variable | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | Port the Express server listens on. | `5000` (or `3000` in dev) |
| `NODE_ENV` | Yes | Runtime environment (`development`, `production`, `test`). | `development` |
| `CORS_ORIGIN` | Yes | Allowed frontend origin for CORS and credentials. | `http://localhost:5173` |
| `MONGODB_URI` | Yes | MongoDB Atlas SRV connection string. | `mongodb+srv://<user>:<pwd>@cluster0.abcde.mongodb.net/airsafe?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME`| Yes | Explicit target database name within Atlas. | `airsafe` |
| `OPENWEATHER_API_KEY` | Yes | OpenWeather API key for live air pollution data. | `your_openweather_api_key` |
| `GOOGLE_CLIENT_ID` | Recommended | Google Cloud OAuth 2.0 Web Client ID. | `your-google-oauth-client-id.apps.googleusercontent.com` |
| `SESSION_SECRET` | Recommended | Secret key for signing session identifiers. | `random-session-signing-secret` |

> **Security Rule:** Never commit `server/.env` to source control. It is ignored by `.gitignore`.

---

## 5. Local Setup & Execution

### Option A: From Repository Root

```bash
# 1. Install server dependencies
cd server
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start development server with auto-reload
npm run dev
```

### Option B: From Inside `server/` Directory

```bash
# Install dependencies
npm install

# Run in development mode (using nodemon)
npm run dev

# Run in production mode
npm start
```

### Verify Server Operation

Once started, test the health check endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-10-11T12:00:00.000Z",
  "version": "1.0.0"
}
```

---

## 6. Verified Implemented Endpoints

All endpoints below have been verified against active route registrations, controllers, and automated integration tests.

### System & Health

#### `GET /api/health`
- **Purpose**: Verifies that the server process is responsive.
- **Parameters**: None.
- **Response (`200 OK`)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-11T12:00:00.000Z",
    "version": "1.0.0"
  }
  ```

---

### Authentication (`/api/auth`)

#### `POST /api/auth/google`
- **Purpose**: Authenticates a user using a Google Identity Services ID token, finds or creates their record in MongoDB Atlas, generates a session, and sets an HTTP-only cookie.
- **Body**:
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZ..."
  }
  ```
  *(Also accepts `{ "credential": "..." }`)*
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Authentication successful.",
    "data": {
      "user": {
        "id": "6708b5e28a9b1c0012345678",
        "email": "user@example.com",
        "name": "Alex Morgan",
        "picture": "https://lh3.googleusercontent.com/a/...",
        "role": "user"
      }
    }
  }
  ```
- **Cookie Issued**: `airsafe_session=<token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` (7 days)

#### `GET /api/auth/me`
- **Purpose**: Restores the authenticated user profile using the active session cookie.
- **Headers**: Session cookie (`airsafe_session`).
- **Response (`200 OK`)**: Returns current user profile object.
- **Response (`401 Unauthorized`)**: If session cookie is missing, expired, or invalid.

#### `POST /api/auth/logout`
- **Purpose**: Invalidates the active session in MongoDB Atlas and clears the `airsafe_session` cookie.
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Logged out successfully."
  }
  ```

---

### Air Quality (`/api/air`)

#### `GET /api/air/current`
- **Purpose**: Fetches real-time air quality metrics and computes US EPA AQI for coordinates.
- **Query Parameters**:
  - `lat` (required, float `-90` to `90`): Latitude.
  - `lon` (required, float `-180` to `180`): Longitude.
- **Example**: `GET /api/air/current?lat=11.0168&lon=76.9558`
- **Response (`200 OK`)**:
  ```json
  {
    "coord": { "lat": 11.0168, "lon": 76.9558 },
    "aqi": 186,
    "category": "Unhealthy",
    "dominantPollutant": "pm2_5",
    "pollutants": {
      "pm2_5": { "concentration": 78.2, "aqi": 186, "unit": "µg/m³" },
      "pm10": { "concentration": 112.5, "aqi": 79, "unit": "µg/m³" },
      "o3": { "concentration": 65.1, "aqi": 58, "unit": "µg/m³" },
      "no2": { "concentration": 18.4, "aqi": 17, "unit": "µg/m³" },
      "so2": { "concentration": 8.3, "aqi": 11, "unit": "µg/m³" },
      "co": { "concentration": 420.0, "aqi": 5, "unit": "µg/m³" }
    },
    "timestamp": "2026-10-11T12:00:00.000Z"
  }
  ```

#### `GET /api/air/forecast`
- **Purpose**: Returns 24-hour hourly and 7-day multi-day air quality forecast projections with clean window recommendations.
- **Query Parameters**: `lat`, `lon` (required floats).
- **Response (`200 OK`)**: Contains `hourly` array, `daily` summary array, and `cleanestWindows`.

---

### Exposure Calculation (`/api/exposure`)

#### `POST /api/exposure/calculate`
- **Purpose**: Computes an activity-adjusted exposure dose, score (0–100), risk level, and health warnings. Automatically records the session in MongoDB Atlas if connected.
- **Body**:
  ```json
  {
    "activity": "running",
    "duration": 45,
    "latitude": 11.0168,
    "longitude": 76.9558
  }
  ```
  *(Valid activities: `running`, `cycling`, `walking`, `outdoor_chores`, `sports`, `commuting`. Optional manual overrides: `aqi`, `pm25`)*
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "data": {
      "score": 68,
      "riskLevel": "high",
      "dose": 215.3,
      "aqi": 186,
      "activity": {
        "id": "running",
        "label": "Running / Jogging",
        "breathingRate": 3.5
      },
      "duration": 45,
      "recommendation": "High exposure risk. Consider shortening duration or moving activity indoors."
    }
  }
  ```

#### `GET /api/exposure/history`
- **Purpose**: Returns logged exposure sessions from MongoDB Atlas.
- **Parameters**: None.
- **Response (`200 OK`)**:
  ```json
  {
    "history": [
      {
        "id": "6708b5e28a9b1c0012345678",
        "activity": "running",
        "activityLabel": "Running / Jogging",
        "duration": 45,
        "aqi": 186,
        "pm25": 78.2,
        "exposureScore": 68,
        "riskLevel": "high",
        "location": "11.0168, 76.9558",
        "date": "2026-10-11T11:45:00.000Z"
      }
    ],
    "count": 1
  }
  ```

---

### Recommendations (`/api/recommendations`)

#### `GET /api/recommendations/current`
- **Purpose**: Generates AQI-stratified health advisories for the general public, sensitive groups, and outdoor athletic activities.
- **Query Parameters**: `lat`, `lon` (required floats).
- **Response (`200 OK`)**: Includes health summary, mask recommendations, and activity-specific guidelines.

#### `GET /api/recommendations/best-time`
- **Purpose**: Analyzes the upcoming 24-hour forecast to identify the safest, lowest-AQI time window for outdoor activities.
- **Query Parameters**: `lat`, `lon` (required floats).
- **Response (`200 OK`)**: Returns optimal time window (`startTime`, `endTime`, `expectedAqi`).

---

### Geocoding & Route Comparison

#### `GET /api/geo/search`
- **Purpose**: Location name autocomplete and coordinate lookup.
- **Query Parameters**:
  - `q` (required string, min 2 chars): Location query.
  - `limit` (optional integer, default `5`).
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "count": 1,
    "results": [
      {
        "name": "Coimbatore",
        "state": "Tamil Nadu",
        "country": "India",
        "latitude": 11.0168,
        "longitude": 76.9558
      }
    ]
  }
  ```

#### `POST /api/routes/compare`
- **Purpose**: Compares transit corridors between origin and destination coordinates, computing exposure scores and waypoints for a direct route vs. a recommended "Green Corridor".
- **Body**:
  ```json
  {
    "origin": "Gandhipuram, Coimbatore",
    "destination": "Saravanampatti, Coimbatore",
    "originCoords": { "latitude": 11.0168, "longitude": 76.9558 },
    "destinationCoords": { "latitude": 11.0420, "longitude": 76.9800 }
  }
  ```
- **Response (`200 OK`)**: Array of 2 corridor objects (`isRecommended: true` green corridor and `isRecommended: false` direct route) with `distanceKm`, `durationMin`, `estimatedExposureScore`, `coordinates`, and `color`.

---

## 7. Database Initialization & Connection Architecture

The database connection is managed by `src/config/db.js`:
- **Connection Lifecycle**: `connectDB()` is called before `app.listen()` in `src/server.js`. If MongoDB Atlas is unreachable during cold start, the server logs diagnostic errors and halts with exit code 1 to prevent serving inconsistent state.
- **Target Database**: Explicitly configured to use `dbName: 'airsafe'` (avoiding default `test` namespace writes).
- **Connection Spying & Tests**: Tests mock `mongoose.connect` using Jest spies, allowing the complete 11-suite backend test suite to run in milliseconds completely offline.
- **Graceful Shutdown**: Catches `SIGINT` and `SIGTERM` signals, closes the HTTP listener, closes Mongoose connection pools cleanly, and exits.

---

## 8. Backend Automated Testing

Run the full Jest test suite:

```bash
npm test
```

### Test Suite Summary
- **Test Files**: 11 passed test suites (`air`, `aqiCalculator`, `auth`, `db`, `exposure`, `exposureCalculator`, `geo`, `health`, `recommendation`, `route`, `server`).
- **Total Tests**: 179 passed unit and integration tests.
- **Environment**: Node environment running with `--runInBand --forceExit` to guarantee reproducible execution without lingering sockets.

---

## 9. Docker Containerization

The backend utilizes `server/Dockerfile` built on `node:22-alpine`:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["npm", "start"]
```

### Build & Run Container

**Build image:**
```bash
docker build -t airsafe-server:latest .
```

**Run container:**
```bash
docker run -d \
  -p 5000:5000 \
  --name airsafe-server \
  --env-file .env \
  airsafe-server:latest
```

---

## 10. CORS & Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **`MongooseServerSelectionError: connection timed out`** | Current IP address is not allowlisted in MongoDB Atlas | Go to Atlas Console > **Network Access**, add your current IP address (or `0.0.0.0/0` temporarily for demo testing). |
| **`CORS error: No 'Access-Control-Allow-Origin' header`** | `CORS_ORIGIN` does not match the frontend origin | Update `server/.env` `CORS_ORIGIN` to match your frontend URL (e.g. `http://localhost:5173` or deployed domain). |
| **`401 Unauthorized` on `/api/auth/me`** | Browser cookie blocked or `credentials` not sent | Ensure the client Axios instance includes `withCredentials: true`, and the browser allows third-party cookies if frontend and backend run on different domains. |
| **`Upstream air quality service returned HTTP 401`** | Invalid or missing `OPENWEATHER_API_KEY` | Sign up for a free OpenWeather API key and set `OPENWEATHER_API_KEY` in `server/.env`. Note that newly generated OpenWeather keys may take 15–60 minutes to activate. |
