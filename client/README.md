# AirSafe Client

The frontend client for **AirSafe**, an air pollution exposure awareness and health recommendation platform built with React, Vite, and Tailwind CSS.

---

## 1. Overview & Responsibilities

The AirSafe client provides a responsive web interface for tracking real-time air quality, calculating personal outdoor exposure doses based on human exertion, discovering cleaner exercise windows, comparing transit routes, and providing campus activity directives.

### Key Implemented Features

- **Public Landing Page (`/`)**: Introduces the platform, showcases live AQI previews, feature breakdowns, calculation methodology, FAQ, and call-to-action flows.
- **Google Authentication (`/login`, `/signup`)**: Integrated with Google Identity Services (GIS) for OAuth 2.0 authentication, handling Google ID tokens with automatic server session sync and HTTP-only cookie credentials. Includes fallback demo sessions for exploration.
- **Live Air Quality Dashboard (`/dashboard`)**: Displays real-time EPA AQI, category badges, key pollutant concentrations ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{O}_3$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$), health advisories, and interactive location search.
- **Personal Exposure Calculator (`/exposure`)**: Calculates individualized pollution doses and a normalized 0–100 exposure score based on physical activity type (e.g., Running, Cycling, Walking, Chores, Commuting) and duration (1–720 minutes).
- **Forecast & Clean Windows (`/forecast`)**: Visualizes 24-hour hourly and 7-day multi-day air quality projections using Recharts, highlighting optimal low-pollution outdoor activity windows.
- **Pollution-Aware Route Comparison (`/routes`)**: Interactive Leaflet maps comparing standard transit corridors against lower-exposure "Green Corridors" with simulated exposure deltas and waypoint routing.
- **Exposure History (`/history`)**: Tracks logged outdoor sessions, aggregated outdoor exposure time, and cumulative risk trends over time.
- **Campus Safe Mode (`/school`)**: Automated school activity directives (Morning Assembly, Physical Education, Recess, Ventilation) mapped to real-time AQI levels with WCAG-compliant contrast.
- **Emergency Simulation Mode**: In-app simulation modal allowing users and evaluators to trigger simulated air quality spikes (e.g., Hazardous 275+ AQI) and test AWS SNS alert delivery states.
- **Dark & Light Mode**: Seamless theme toggling with curated slate palettes and high-contrast accessibility tokens across all components.

---

## 2. Technology Stack & Dependencies

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React 18.3](https://react.dev/) | Component architecture & client state |
| **Build Tool** | [Vite 6.1](https://vitejs.dev/) | Fast HMR dev server & Rollup production bundling |
| **Routing** | [React Router v6.28](https://reactrouter.com/) | Declarative client-side routing & route guards |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Utility-first CSS, dark-mode styling, and design tokens |
| **HTTP Client** | [Axios 1.7](https://axios-http.com/) | Backend API communication with cookie credentials |
| **Interactive Maps** | [Leaflet 1.9](https://leafletjs.com/) & [React-Leaflet 4.2](https://react-leaflet.js.org/) | Route corridor rendering and geospatial overlays |
| **Data Visualization** | [Recharts 2.15](https://recharts.org/) | Hourly & 7-day forecast pollutant charts |
| **Icons** | [Lucide React 0.475](https://lucide.dev/) | Clean, accessible SVG iconography |
| **Testing** | [Vitest 3.0](https://vitest.dev/) & [Testing Library](https://testing-library.com/) | Unit & integration tests in jsdom environment |

---

## 3. Directory Structure

```text
client/
├── public/                 # Static public assets and SVG icons
├── src/
│   ├── __tests__/          # Vitest suites (components, auth, routing, utilities)
│   ├── components/         # Reusable presentation and layout components
│   │   ├── auth/           # GoogleSignInButton, ProtectedRoute, GuestRoute
│   │   ├── common/         # Navbar, Footer, Card, Badge, LocationSearchInput
│   │   ├── dashboard/      # AqiDisplay, PollutantGrid, HealthAdvisory
│   │   ├── exposure/       # ActivitySelector, DurationSlider, ExposureScoreCard
│   │   ├── forecast/       # HourlyForecastChart, CleanWindowCard
│   │   ├── routes/         # RouteMap, CorridorComparisonCard
│   │   └── school/         # SchoolSafeModeCard
│   ├── context/            # React context providers
│   │   ├── AirQualityContext.jsx   # Selected location and live/mock AQI data
│   │   ├── AuthContext.jsx         # Google authentication and user session state
│   │   ├── SimulationContext.jsx   # Hazardous spike simulation & alerts
│   │   └── ThemeContext.jsx        # Dark/light theme state & document classes
│   ├── pages/              # Top-level view pages
│   │   ├── DashboardPage.jsx
│   │   ├── ExposureCalculatorPage.jsx
│   │   ├── ForecastPage.jsx
│   │   ├── HistoryPage.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RouteComparisonPage.jsx
│   │   ├── SchoolSafePage.jsx
│   │   └── SignupPage.jsx
│   ├── services/           # API integration clients & mock data fallbacks
│   │   ├── airQualityService.js
│   │   ├── api.js          # Shared Axios instance with credentials & timeout
│   │   ├── authService.js   # Google OAuth and session validation
│   │   ├── exposureService.js
│   │   ├── geocodingService.js
│   │   ├── mockData.js     # Deterministic offline fallback datasets
│   │   └── routeService.js
│   ├── utils/              # Client calculations, EPA AQI math, and formatters
│   ├── App.jsx             # Root route declarations and Context Provider tree
│   ├── index.css           # Global typography, surface utility classes, Tailwind
│   ├── main.jsx            # React root mount
│   └── setupTests.js       # Vitest global test setup and DOM polyfills
├── .dockerignore           # Build exclusions for container images
├── .env.example            # Environment variable template
├── Dockerfile              # Multi-stage production container build (Node -> Nginx)
├── index.html              # HTML shell with Google Identity Services script
├── nginx.conf              # Production Nginx reverse proxy and SPA routing
├── package.json            # Client dependencies and npm scripts
├── tailwind.config.js      # Palette extensions, AQI levels, dark mode configuration
└── vite.config.js          # Vite configuration and Vitest test runner setup
```

---

## 4. Prerequisites

- **Node.js**: `18.x` or `20.x` or `22.x` (LTS recommended)
- **npm**: `9.x` or later

---

## 5. Local Setup & Development

### 1. Install Dependencies

From the repository root:
```bash
cd client
npm install
```

### 2. Configure Environment Variables

Create a local `.env` file from the provided template:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux (Bash):**
```bash
cp .env.example .env
```

Edit `client/.env` and specify your configuration:

```ini
# AirSafe Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_MOCK_DATA=false
VITE_OPENWEATHER_API_KEY=
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

### Environment Variables Explained

| Variable | Required | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Yes | Base URL of the AirSafe Express backend. Set to `http://localhost:5000/api` in local development, or `/api` when served behind Nginx / reverse proxy. |
| `VITE_USE_MOCK_DATA` | Optional | Set to `true` to force client-side mock datasets regardless of backend status. If `false` (default), the client makes live backend calls and falls back gracefully if the backend is unreachable. |
| `VITE_OPENWEATHER_API_KEY` | Optional | Direct client OpenWeather key for fallback geocoding or direct API mode. In normal operation, all requests route securely through the backend. |
| `VITE_GOOGLE_CLIENT_ID` | Recommended | Google Cloud OAuth 2.0 Web Client ID for Google Identity Services. When set, renders the native Google Sign-In button. If omitted, the app displays a configuration notice and allows Demo Mode. |

> **Security Note:** Never commit `client/.env` to source control. It is ignored by `.gitignore`.

### 3. Start Development Server

```bash
npm run dev
```

The Vite development server will start at:
```text
http://localhost:5173
```

---

## 6. Build & Test Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite HMR development server on port `5173`. |
| `npm run build` | Compiles and minifies the production application into `dist/`. |
| `npm run preview` | Serves the locally generated `dist/` production bundle for preview. |
| `npm test` | Runs the Vitest test runner across all client unit and integration tests. |

---

## 7. API Connection & Authentication Architecture

### API Client (`src/services/api.js`)
All HTTP communication passes through a pre-configured Axios instance:
- **Base URL**: Dynamically configured via `VITE_API_BASE_URL`.
- **Credentials**: `withCredentials: true` ensures that session cookies (`airsafe_session`) are automatically sent with cross-origin or same-origin requests.
- **Timeout**: Enforces an 8-second request deadline.
- **Interceptors**: Normalized error responses handling network errors and backend error payloads gracefully.

### Google Sign-In Flow
1. `index.html` loads the Google Identity Services client script:
   ```html
   <script src="https://accounts.google.com/gsi/client" async defer></script>
   ```
2. `GoogleSignInButton.jsx` initializes the button using `import.meta.env.VITE_GOOGLE_CLIENT_ID`.
3. Upon user authorization, Google returns an ID token (`credential`).
4. `authService.loginWithGoogle(idToken)` sends the credential to `POST /api/auth/google`.
5. The backend validates the cryptographic signature with Google, creates a session in MongoDB Atlas, and sets an `airsafe_session` HTTP-only cookie.
6. The client updates `AuthContext` with the user profile and grants access to protected routes.

---

## 8. Docker Build & Container Execution

The client includes a production-ready, multi-stage `Dockerfile` based on Node 20 and Alpine Nginx.

### Multi-Stage Build Strategy
1. **Stage 1 (`build`)**: Installs dependencies via `npm ci`, sets build arguments (`VITE_API_BASE_URL`, `VITE_USE_MOCK_DATA`), and compiles the static bundle with `npm run build`.
2. **Stage 2 (`production`)**: Copies the compiled `dist/` directory into an `nginx:alpine` image and configures `nginx.conf` to serve static assets and proxy `/api/` traffic.

### Build and Run Standalone Container

**Build image:**
```bash
docker build -t airsafe-client:latest .
```

**Run container on port 8080:**
```bash
docker run -d -p 8080:80 --name airsafe-client airsafe-client:latest
```

Access the application at `http://localhost:8080`.

---

## 9. Routing Behavior & Deployment Notes

### Routing Configuration
- Utilizes React Router v6 `BrowserRouter` with `future` v7 flags (`v7_startTransition`, `v7_relativeSplatPath`).
- **Route Guards**:
  - `ProtectedRoute`: Redirects unauthenticated visitors to `/login`, preserving destination intent in location state.
  - `GuestRoute`: Redirects signed-in users attempting to access `/login` or `/signup` directly to `/dashboard`.

### Single Page Application (SPA) Fallback
Because routing is handled client-side by React Router:
- **Nginx (`client/nginx.conf`)**: Configured with `try_files $uri $uri/ /index.html;` to ensure direct page refreshes on subroutes (e.g., `/dashboard`, `/school`) resolve to `index.html`.
- **Vercel**: Static build automatically rewrites non-file routes to `index.html`.

---

## 10. Troubleshooting

| Issue | Likely Cause | Solution |
| :--- | :--- | :--- |
| **"Google Client ID is not configured"** | Missing `VITE_GOOGLE_CLIENT_ID` in `.env` | Add your Google OAuth Client ID to `client/.env` and restart the Vite dev server. |
| **"Network Error" or `500` on API calls** | Backend server is not running on port 5000 | Verify the backend is running (`cd server && npm run dev`) and `VITE_API_BASE_URL` points to `http://localhost:5000/api`. |
| **Session cookie not persisting** | CORS origin mismatch or insecure cookie over HTTP | Ensure `CORS_ORIGIN` in `server/.env` exactly matches your frontend port (e.g., `http://localhost:5173`). |
| **Leaflet Map tiles not displaying correctly** | Missing stylesheet or container dimensions | Ensure the Leaflet CSS is present and map container has defined height (`h-[400px]` or similar). |
| **Offline / Development without API keys** | No OpenWeather or Google API access | Set `VITE_USE_MOCK_DATA=true` in `client/.env` to run completely offline with built-in mock datasets. |