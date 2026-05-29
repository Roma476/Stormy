# 🌩️ Stormy

Weather forecast web app for Italy, built with React + Vite on the frontend and Python FastAPI on the backend.

Live at: [stormy-frontend.onrender.com](https://stormy-frontend.onrender.com)

> **Note:** The backend is currently not in use in production. The live version calls the Open-Meteo API directly from the frontend due to hosting limitations (IP blocks on the free tier). The FastAPI backend is fully functional locally and is intended to be the production data layer once a stable hosting solution is in place.

Developed by Friciu Robert Gabriel as a school project, May 2026.

## About

Stormy shows real-time weather data for the main Italian cities and macro-areas (North, Centre, South), powered by the [Open-Meteo](https://open-meteo.com/) API — free and no API key required. Users can also search any city by name and get current conditions instantly.

## Features

- **Dashboard** — current weather snapshot for Milano, Roma, Napoli and Torino, plus macro-area overviews for North, Centre and South Italy
- **City search** — search any Italian (or world) location by name using the Open-Meteo geocoding API
- **7-day forecast tabs** — weekly day navigation on the forecast panel
- **Quick city links** — one-click weather for 12 major Italian cities
- **Tool cards** — placeholders for future features: Satellite, Allerte, Pollini, Neve, Mari

## Tech Stack

**Frontend**
- React 19, Vite 8, plain CSS
- Hosted on Render Static Site

**Backend**
- Python 3.14, FastAPI, Uvicorn, httpx
- Docker
- Hosted on Render Web Service

**Data**
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs) — weather data
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) — city search

## Repository Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/     — Navbar, Footer
│   │   └── pages/          — HomePage (main view)
│   ├── index.html
│   └── package.json
└── backend/
    ├── routers/
    │   └── weather.py      — API routes: /search, /weather, /dashboard/summary
    ├── services/
    │   ├── weather.py      — Open-Meteo integration
    │   └── geocoding.py    — geocoding integration
    ├── models/
    │   └── schemas.py      — Pydantic schemas, WMO code mapping
    ├── data/
    │   └── featured_cities.py  — hardcoded coordinates for dashboard cities
    ├── main.py             — FastAPI app, CORS, router registration
    ├── Dockerfile
    └── requirements.txt
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/search?q={city}` | Geocode a city by name |
| GET | `/api/weather?lat={lat}&lon={lon}` | Current weather + 7-day forecast |
| GET | `/api/dashboard/summary` | Weather snapshot for all dashboard locations |

## Local Development

**Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Create a `frontend/.env` file with:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

**Docker (backend)**

```bash
cd backend
docker build -t stormy-backend .
docker run -p 8000:8000 --env-file .env stormy-backend
```