# 🌩️ Stormy

Weather forecast web app for Italy, built with React + Vite on the frontend and Python FastAPI on the backend.

Live at: [stormy-frontend.onrender.com](https://stormy-frontend.onrender.com)

> **Note:** The backend is currently not in use in production. The live version calls the Open-Meteo API directly from the frontend due to hosting limitations (IP blocks on the free tier). The FastAPI backend is fully functional locally and is intended to be the production data layer once a stable hosting solution is in place.

## About

Stormy shows real-time weather data for Italian cities. Users can search any location by name, get current conditions, and browse a 3b-meteo style 7-day forecast with hourly breakdown. Weather tools provide in-depth data for satellite radar, alerts, pollen, snow and sea conditions — all powered by Open-Meteo, free and no API key required.

## Features

- **Instant load** — Milano data loads first, rest populates in background
- **City search** — search any Italian (or world) location using the Open-Meteo geocoding API
- **7-day forecast** — day strip with Meteocons animated icons + hourly table (temp, rain, wind) in 3b-meteo style
- **Hourly forecast** — starts from current hour for today, full 24h for future days
- **Weather tools** — Radar (Windy embed), Allerte, Pollini, Neve, Mari — each with real Open-Meteo data
- **Quick city links** — one-click weather for 12 major Italian cities

## Tech Stack

**Frontend**
- React 19, Vite 8, plain CSS
- [Meteocons](https://meteocons.com/) animated SVG weather icons
- [Windy](https://www.windy.com/) embed for radar/satellite
- Hosted on Render Static Site

**Backend**
- Python 3.14, FastAPI, Uvicorn, httpx
- Docker
- Hosted on Render Web Service

**Data**
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs) — weather + hourly data
- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) — pollen data
- [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api) — sea conditions
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) — city search

## Repository Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/     — Navbar, Footer, ToolModal
│   │   └── pages/          — HomePage, AboutPage
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