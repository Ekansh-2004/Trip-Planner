# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Trip Planner is a full-stack travel planning app with two independently-run services:

```
backend/   Express 5 + MongoDB (Mongoose) REST API — port 3001
frontend/  React 19 (Vite) SPA — port 5173
```

NLP-based trip-query parsing (`/api/nlp/analyze`) calls the Groq API directly from the Node backend — there is no separate NLP microservice.

## Commands

### Backend (`backend/`)
```bash
npm install
npm run dev     # nodemon server.js, http://localhost:3001
npm start        # node server.js (no reload)
```
No test suite exists (`npm test` is a stub that exits 1). There is no linter configured for the backend.

### Frontend (`frontend/`)
```bash
npm install
npm run dev       # vite dev server, http://localhost:5173
npm run build     # production build
npm run lint      # eslint .
npm run preview   # preview a production build
```
No test suite is configured.

### Running everything
Start backend then frontend. Each service reads its own `.env`/config; there's no shared root env file.

## Environment

- `backend/.env`: `PORT`, `NODE_ENV`, `MONGODB_URI` (Mongoose connects with `dbName: "TripPlanner"` hardcoded in `config/db.js`, regardless of what's in the URI), `JWT_SECRET`, `GOOGLE_API_KEY` (needs Geocoding, Places, Distance Matrix, and Weather APIs enabled on the same GCP project), `GROQ_API_KEY` (used by `/api/nlp/analyze`; the Groq client in `utils/groqClient.js` is constructed lazily on first use specifically so a missing key doesn't crash the whole server at boot — don't change that back to eager construction at import time).
- `frontend/.env`: `VITE_API_URL` — required. `vite.config.js` relies on Vite's built-in `VITE_*` env exposure; do not reintroduce a manual `define` override for `import.meta.env.VITE_API_URL`, since that bypasses `.env` loading entirely and silently resolves to `undefined` at runtime (this has broken login/signup/itinerary fetches before).
- Google Weather API (`weather.googleapis.com`) is called with a plain `key=` query param like the other Maps APIs, not OAuth2 — confirmed working with a valid Maps Platform key.

## Architecture

### Auth
JWT stored in an HTTP-only cookie (`utils/generateToken.js`), verified in `middleware/protectRoute.js`, which attaches `req.user` (password field excluded). Cookie attributes differ by `NODE_ENV`: `sameSite: "lax", secure: false` in dev, `SameSite=None; Secure; Partitioned` in production (set via raw `Set-Header` rather than `res.cookie`, because cross-site cookies for the deployed frontend origin need `Partitioned`). Nearly every route except `/api/auth/*` and `/api/geocode` requires `protectRoute`.

### Route mounting (`server.js`)
Routes are mounted under prefixes that don't always match the sub-router's own path segments — check both files together when tracing an endpoint:
- `/api/auth` → `routes/authRoute.js`
- `/api/places` → `routes/placeRoute.js` (`/hotels`, `/restaurants`, `/attractions`, `/by-city`, `/coordinates` — all plural)
- `/api/location-info` → `routes/locationInfoRoute.js` (combined weather+traffic)
- `/api/itinerary` → `routes/itineraryRoute.js`
- `/api/nlp` → `routes/nlpRoute.js`
- `/api/culture` → `routes/cultureRoute.js`, exposing `/cuisine/:city` (**singular**) and `/activities/:city` (plural) — an easy source of frontend/backend URL mismatches
- `/api/geocode` (unauthenticated) is defined inline in `server.js`, separate from `placeController.js`'s own `/api/places/coordinates` geocoding — two independent geocoding code paths exist; keep them consistent if fixing one.

### Itinerary generation (`controllers/itineraryController.js`)
Given a start location, city, and day count:
1. Checks for an existing cached itinerary for that user/city/day-count within a small lat/lng bounding box before generating a new one.
2. Pulls candidate `Place` documents for the city, sorted by `ranking`.
3. Runs a custom k-means implementation (`KMeans`, k = number of days) using haversine distance to geographically cluster attractions, then assigns clusters to days ordered by proximity to the start location.
4. Within each day, orders attractions by nearest-neighbor proximity (`sortDayByProximity`), starting from the previous day's last attraction (or the trip start on day 1).
5. Splits each day's attractions into `morning` (first 3) / `evening` (rest) arrays of `Place` refs, stored on `Itinerary.daysPlan`.
This is all in-memory JS, not a DB aggregation — if attraction pools are large, expect it to be O(n·k·iterations).

### Data model relationships
`User.itineraries[]` → `Itinerary` docs → `Itinerary.daysPlan[].{attractions,morning,evening}` → `Place` refs (populated on read). `Place`, `Cuisine`, and `Activity` are independent city-keyed collections seeded from `backend/data.json`-style sources; there's no referential integrity between them beyond matching `city` strings, so seed data must use consistent city names across collections for lookups to line up. Note: Mongoose schemas silently drop any DB fields not declared in the schema on read — if a collection's documents don't exactly match the schema (e.g., a schema expecting `name` when the actual data uses `title`), the API will return `undefined` for that field with no error. Verify actual document shape in Mongo before trusting a model file when debugging "field is missing" bugs.

### Frontend data flow
`ItineraryPage.jsx` builds a client-side "timeline" array (`buildItineraryTimeline`) by merging the backend's day-by-day attraction data with generated `action` entries (lunch/dinner/hotel prompts) and `travel` entries (fetched per-leg from `/api/location-info` for traffic). Timeline item shape matters: `type: "action"` entries must carry `actionType`, `lat`, `lng`, `city`, and `buttonText` *inside* their `details` object, since only `details` is spread into `ActionCard` and passed to the click handler — anything placed as a sibling of `details` is silently dropped.

### NLP flow
`NLPPlanPage.jsx` → `POST /api/nlp/analyze` → `nlpController.js` calls the Groq API (`llama-3.3-70b-versatile`, JSON mode) directly, extracting a structured object (`destination_type`, `city`, `duration_days`, `budget_tier`, `group_type`, `interests`, `season`) from the free-text query. Suggestions are then **grounded in the `Place` collection** rather than hardcoded: `CATEGORY_KEYWORDS` maps each `destination_type` to keyword substrings, matched case-insensitively against `Place.feature` text via a Mongo aggregation that ranks cities by match count (category keywords plus any extracted `interests` are combined into the match set). If the LLM extracted a named `city`, it's checked against the DB first (case-insensitive exact match) and — only if present — placed first in the results; a city the LLM names that isn't in the `Place` collection (e.g. "Manali") is silently dropped rather than suggested, since suggesting it would make itinerary generation fail downstream with "not enough attractions." Only 9 cities currently have `Place` data (Agra, Amritsar, Delhi, Goa, Jaipur, Mumbai, Rishikesh, Udaipur, Varanasi), so category coverage is uneven — e.g. `hill_station` has almost no real matches in this dataset. The `extracted` fields beyond `detected_category` are returned but not yet consumed by the frontend beyond `city`.

## Known gaps / footguns worth knowing before touching related code
- No `backend/.env.example` exists despite the README referencing one.
- `.gitignore` is split across the repo root, `backend/`, and `frontend/`; check all three before assuming a file type is ignored.
- Weather API failures, traffic API failures, and geocoding failures are handled inconsistently across controllers — some return partial data (`Promise.allSettled` in `locationInfoController.js`), others fail the whole request.
