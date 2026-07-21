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
This is all in-memory JS, not a DB aggregation — if attraction pools are large, expect it to be O(n·k·iterations). Both the cache-hit and freshly-generated response paths of `generateItinerary` now also return `itineraryId` (the Mongo `_id`) alongside `itinerary` (the `daysPlan` array), so the frontend has an id to share against even for a just-generated trip, not only ones loaded from history.

### Sharing (`POST /api/itinerary/:itineraryId/share`, `GET /api/itinerary/public/:shareToken`)
`shareItinerary` (protected, owner-only — 403 if `itinerary.user` doesn't match `req.user._id`) lazily generates a random `shareToken` (`crypto.randomBytes(16).toString("hex")`) on the `Itinerary` doc and returns it; calling it again on an already-shared itinerary just returns the existing token rather than rotating it. `getPublicItinerary` is the one deliberately **unauthenticated** route inside `itineraryRoute.js` (same pattern as `/api/geocode` in `server.js` — an intentional exception, not an oversight) and looks the itinerary up by `shareToken` alone; the response is trimmed to `city`, `days`, `daysPlan`, `createdAt` only — no `user` field — so a shared link never leaks who owns the trip. On the frontend, `ItineraryPage.jsx` tracks the current trip's `itineraryId` (from `existingHistoryItem._id` when loaded from history, or `data.itineraryId` when freshly generated — also persisted into the `localStorage` cache blob alongside the timeline, so a page reload doesn't lose it) and a "Share" button calls `POST /api/itinerary/:itineraryId/share`, copying `origin/share/{token}` to the clipboard. `PublicItineraryPage.jsx` (route `/share/:token`, registered in **both** branches of the auth-gated `Routes` in `App.jsx` — the unauthenticated `!authUser` fallback normally redirects everything else to `/login`, so this route has to be added there explicitly or shared links would be unreachable by logged-out visitors) renders a simplified read-only day-by-day view via `GET /api/itinerary/public/:token` — no traffic data, no action buttons, no auth required.

### PDF export
No new dependency — "Export PDF" (on both `ItineraryPage.jsx` and `PublicItineraryPage.jsx`) just calls `window.print()`; the browser's native print-to-PDF handles the rest. Chrome/print-friendly output is achieved with Tailwind's built-in `print:` variant sprinkled on the UI chrome that shouldn't appear on paper — `Navbar.jsx`'s `<header>`, `DayNavigation.jsx`'s sticky tab bar, the Itinerary/Cuisine/Activities tab pill, the Share/Refresh/Export button row, share/refresh status text, and each `ActionCard`'s button (the card's title/subtitle text still prints — only the non-functional button is hidden). The decorative page background (`AppLayout`'s `getPageStyle()` inline style, e.g. `DiscoverBG.png` on `/itinerary`) is stripped via a `.app-shell` class + a plain `@media print` rule in `styles.css`, since an inline `style` attribute can't be overridden by a Tailwind utility class alone.

### Data model relationships
`User.itineraries[]` → `Itinerary` docs → `Itinerary.daysPlan[].{attractions,morning,evening}` → `Place` refs (populated on read). `Place`, `Cuisine`, and `Activity` are independent city-keyed collections seeded from `backend/data.json`-style sources; there's no referential integrity between them beyond matching `city` strings, so seed data must use consistent city names across collections for lookups to line up. Note: Mongoose schemas silently drop any DB fields not declared in the schema on read — if a collection's documents don't exactly match the schema (e.g., a schema expecting `name` when the actual data uses `title`), the API will return `undefined` for that field with no error. Verify actual document shape in Mongo before trusting a model file when debugging "field is missing" bugs.

### Frontend data flow
`ItineraryPage.jsx` builds a client-side "timeline" array (`buildItineraryTimeline`) by merging the backend's day-by-day attraction data with generated `action` entries (lunch/dinner/hotel prompts) and `travel` entries (fetched per-leg from `/api/location-info` for traffic). Timeline item shape matters: `type: "action"` entries must carry `actionType`, `lat`, `lng`, `city`, and `buttonText` *inside* their `details` object, since only `details` is spread into `ActionCard` and passed to the click handler — anything placed as a sibling of `details` is silently dropped.

### NLP flow
`NLPPlanPage.jsx` → `POST /api/nlp/analyze` → `nlpController.js` calls the Groq API (`llama-3.3-70b-versatile`, JSON mode) directly, extracting a structured object (`destination_type`, `city`, `duration_days`, `budget_tier`, `group_type`, `interests`, `season`) from the free-text query. Suggestions are then **grounded in the `Place` collection** rather than hardcoded: `CATEGORY_KEYWORDS` maps each `destination_type` to keyword substrings, matched case-insensitively against `Place.feature` text via a Mongo aggregation that ranks cities by match count (category keywords plus any extracted `interests` are combined into the match set). If the LLM extracted a named `city`, it's checked against the DB first (case-insensitive exact match) and — only if present — placed first in the results; a city the LLM names that isn't in the `Place` collection (e.g. "Manali") is silently dropped rather than suggested, since suggesting it would make itinerary generation fail downstream with "not enough attractions." `analyzeTravelQuery` rejects queries over 500 chars, caches full responses in-process (keyed by normalized/lowercased text, 10-minute TTL, capped at 200 entries — not persisted, resets on restart) to skip repeat Groq calls, and distinguishes Groq failure modes: `Groq.APIConnectionTimeoutError` → 504, `Groq.RateLimitError` → 429, other `Groq.APIError` → 502; the Groq client itself (`utils/groqClient.js`) is constructed with a 15s timeout and `maxRetries: 1`. Only 9 cities currently have `Place` data (Agra, Amritsar, Delhi, Goa, Jaipur, Mumbai, Rishikesh, Udaipur, Varanasi), so category coverage is uneven — e.g. `hill_station` has almost no real matches in this dataset. Clicking a suggestion chip navigates to `/manual-plan` with `{ destination, durationDays }` in router state: `ManualPlanPage.jsx` uses `destination` to skip its own destination-entry step (starts at step 2, "starting point") and uses `durationDays` (from `extracted.duration_days`, may be `null`) to pre-fill start/end dates (start = tomorrow, end = start + duration_days − 1), so the user only has to supply a starting point and confirm before generating the itinerary. If Groq didn't extract a `duration_days`, `NLPPlanPage.jsx` shows a lightweight local follow-up (a plain number input, "How many days is your trip?") above the suggestion chips instead of leaving it blank — this is **not** a second Groq call, just client-side state (`manualDuration`) merged in when a chip is clicked, to avoid burning extra LLM calls for something the user can just type. `extracted` fields other than `city` and `duration_days` (budget_tier, group_type, interests, season) are returned by the API but not consumed anywhere downstream yet — no controller or page reads them, so there's currently no reason to build a follow-up prompt for them.

## Known gaps / footguns worth knowing before touching related code
- No `backend/.env.example` exists despite the README referencing one.
- `.gitignore` is split across the repo root, `backend/`, and `frontend/`; check all three before assuming a file type is ignored.
- Weather API failures, traffic API failures, and geocoding failures are handled inconsistently across controllers — some return partial data (`Promise.allSettled` in `locationInfoController.js`), others fail the whole request.
