# main.py
# Entry point dell'applicazione FastAPI.
# Configura CORS, middleware, logging e registra il router meteo.

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.weather import router as weather_router

# ─────────────────────────────────────────────
#  Caricamento variabili d'ambiente da .env
# ─────────────────────────────────────────────
load_dotenv()

# ─────────────────────────────────────────────
#  Configurazione logging
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
#  Lifespan: operazioni di avvio/arresto
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestisce l'intero ciclo di vita dell'app.
    Codice prima di 'yield' → eseguito all'avvio.
    Codice dopo 'yield'  → eseguito allo spegnimento.
    """
    logger.info("🚀 Backend meteo in avvio...")
    yield
    logger.info("🛑 Backend meteo in chiusura.")


# ─────────────────────────────────────────────
#  Istanza FastAPI
# ─────────────────────────────────────────────
app = FastAPI(
    title="Italy Weather API",
    description=(
        "Backend meteo focalizzato sull'Italia. "
        "Usa Open-Meteo (gratuito, senza API key) per i dati meteorologici "
        "e Open-Meteo Geocoding per la ricerca delle città."
    ),
    version="1.0.0",
    lifespan=lifespan,
    # In produzione imposta docs_url=None e redoc_url=None
    docs_url="/docs",
    redoc_url="/redoc",
)


# ═══════════════════════════════════════════════════════════════
#  CORS MIDDLEWARE
#  Consente al frontend React (Vite su localhost:5173) di
#  effettuare richieste cross-origin verso questo backend.
# ═══════════════════════════════════════════════════════════════

# Origini autorizzate: in sviluppo solo Vite; in produzione
# aggiungere l'URL di produzione del frontend.
ALLOWED_ORIGINS: list[str] = [
    "http://localhost:5173",      # Vite dev server
    "http://127.0.0.1:5173",      # alias localhost
]

# Lettura opzionale di origini aggiuntive da .env
#   CORS_EXTRA_ORIGINS=https://miodominio.it,https://www.miodominio.it
extra_origins_env = os.getenv("CORS_EXTRA_ORIGINS", "")
if extra_origins_env:
    ALLOWED_ORIGINS.extend(
        [o.strip() for o in extra_origins_env.split(",") if o.strip()]
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,        # Origini esplicitamente permesse
    allow_credentials=True,               # Necessario se il frontend usa cookie/auth header
    allow_methods=["GET", "OPTIONS"],     # Solo i metodi usati da questa API
    allow_headers=["*"],                  # Header liberi (es. Authorization, Content-Type)
)


# ═══════════════════════════════════════════════════════════════
#  REGISTRAZIONE ROUTER
# ═══════════════════════════════════════════════════════════════

app.include_router(
    weather_router,
    prefix="/api",    # Tutte le rotte saranno /api/search, /api/weather, ecc.
)


# ─────────────────────────────────────────────
#  Health-check base (opzionale ma utile)
# ─────────────────────────────────────────────
@app.get("/health", tags=["Sistema"], summary="Health check")
async def health_check() -> dict[str, str]:
    """Verifica che il server sia attivo e risponda correttamente."""
    return {"status": "ok", "service": "italy-weather-api"}


# ─────────────────────────────────────────────
#  Avvio diretto con: python main.py
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,          # Hot-reload in sviluppo
        log_level="info",
    )