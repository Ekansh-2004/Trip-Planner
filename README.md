# Trip Planner

A full-stack travel planning app that lets users search destinations, build itineraries, discover nearby hotels/restaurants/attractions, check weather & traffic conditions, and get AI-assisted trip suggestions from natural-language descriptions.

## Project Structure

```
Trip-Planner/
├── backend/            Express + MongoDB REST API
└── frontend/           React (Vite) single-page app
```

## Tech Stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Framer Motion, Google Maps React Wrapper
- **Backend:** Node.js, Express 5, MongoDB (Mongoose), JWT auth (cookie-based)
- **NLP:** Groq-hosted LLM (`llama-3.3-70b-versatile`) for structured extraction from natural-language trip queries
- **External APIs:** Google Geocoding, Places, Distance Matrix, and Weather APIs

## Features

- Email/password authentication with JWT stored in an HTTP-only cookie
- Location search & geocoding
- Nearby hotels, restaurants, and attractions lookup
- Combined weather + traffic info for a place
- Itinerary generation, history, and deletion
- City-based cuisine and activity recommendations
- Natural-language trip query parsing (e.g. "a relaxing beach trip") via a Groq-hosted LLM

## Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)
- A Google Cloud API key with the **Geocoding**, **Places**, **Distance Matrix**, and **Weather** APIs enabled

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values
npm run dev             # starts on http://localhost:3001
```

See [backend/.env.example](backend/.env.example) for the required environment variables.

### 2. Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` with:

```
VITE_API_URL=http://localhost:3001
```

Then start the dev server:

```bash
npm run dev              # starts on http://localhost:5173
```

The backend's `/api/nlp/analyze` route calls the Groq API directly — set `GROQ_API_KEY` in `backend/.env` (see [backend/.env.example](backend/.env.example)) for NLP-based trip queries to work.

## Running the Full Stack

Start both services in separate terminals:

1. Backend API (`localhost:3001`)
2. Frontend dev server (`localhost:5173`)

## API Overview

All routes are prefixed with `/api`. Most routes require authentication (JWT cookie set via login/signup).

| Route | Description |
|---|---|
| `POST /api/auth/signup` | Create an account |
| `POST /api/auth/login` | Log in |
| `POST /api/auth/logout` | Log out |
| `GET /api/auth/me` | Get current user (protected) |
| `POST /api/places/coordinates` | Geocode a location (protected) |
| `POST /api/places/hotels` | Nearby hotels (protected) |
| `POST /api/places/restaurants` | Nearby restaurants (protected) |
| `POST /api/places/attractions` | Nearby attractions (protected) |
| `POST /api/places/by-city` | Attractions by city (protected) |
| `GET /api/location-info/:placeId` | Combined weather & traffic info (protected) |
| `POST /api/itinerary` | Generate an itinerary (protected) |
| `GET /api/itinerary/history` | Get itinerary history (protected) |
| `DELETE /api/itinerary/:itineraryId` | Delete an itinerary (protected) |
| `GET /api/culture/cuisine/:city` | Cuisines by city (protected) |
| `GET /api/culture/activities/:city` | Activities by city (protected) |
| `POST /api/nlp/analyze` | Parse a natural-language trip query |
| `GET /api/geocode?location=...` | Simple geocoding lookup |

## License

No license specified.
