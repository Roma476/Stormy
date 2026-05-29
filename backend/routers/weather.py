# routers/weather.py
# Router FastAPI che espone tutte le rotte meteo del backend.
# Prefisso base "/api" incluso in main.py tramite include_router.

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException, Query

from models.schemas import DashboardSummaryResponse, SearchResponse, WeatherResponse
from services.geocoding import get_coordinates
from services.weather import get_dashboard_weather, get_weather_by_coords

logger = logging.getLogger(__name__)

# Il prefisso "/api" viene impostato in main.py; qui usiamo tag per la docs
router = APIRouter(tags=["Meteo"])


# ═══════════════════════════════════════════════════════════════
#  GET /api/search?q={nome_citta}
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/search",
    response_model=SearchResponse,
    summary="Cerca una città per nome",
    description=(
        "Interroga il servizio di geocoding per trovare le coordinate "
        "di una città. Restituisce una lista di risultati con coordinate, "
        "paese e fuso orario."
    ),
)
async def search_city(
    q: str = Query(
        ...,
        min_length=2,
        max_length=100,
        description="Nome della città da cercare (es. 'Milano', 'Firenze')",
    )
) -> SearchResponse:
    """
    Cerca una città tramite geocoding e restituisce le coordinate.

    - **q**: stringa di ricerca (minimo 2 caratteri)
    """
    # Il geocoding service restituisce None oppure un singolo dizionario
    result = await get_coordinates(q)

    if result is None:
        # Nessun risultato trovato: lista vuota (non un errore 404)
        return SearchResponse(results=[], query=q)

    return SearchResponse(results=[result], query=q)


# ═══════════════════════════════════════════════════════════════
#  GET /api/weather?lat={lat}&lon={lon}
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/weather",
    response_model=WeatherResponse,
    summary="Meteo dettagliato per coordinate",
    description=(
        "Restituisce il meteo corrente e le previsioni a 7 giorni "
        "per una coppia di coordinate geografiche. "
        "Il parametro 'name' è opzionale (label per la risposta)."
    ),
)
async def get_weather(
    lat: float = Query(..., ge=-90, le=90, description="Latitudine WGS-84"),
    lon: float = Query(..., ge=-180, le=180, description="Longitudine WGS-84"),
    name: str = Query(
        default="Posizione",
        max_length=100,
        description="Nome descrittivo della località (opzionale)",
    ),
    timezone: str = Query(
        default="Europe/Rome",
        description="Fuso orario IANA (default: Europe/Rome)",
    ),
) -> WeatherResponse:
    """
    Recupera meteo attuale + forecast 7 giorni.

    Parametri obbligatori:
    - **lat**: latitudine (es. 45.4654)
    - **lon**: longitudine (es. 9.1859)

    Parametri opzionali:
    - **name**: etichetta della città nella risposta (es. "Milano")
    - **timezone**: fuso orario IANA (default: Europe/Rome)
    """
    try:
        weather = await get_weather_by_coords(
            latitude=lat,
            longitude=lon,
            city_name=name,
            timezone=timezone,
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Timeout nella comunicazione con il servizio meteo. Riprova tra poco.",
        )
    except httpx.HTTPStatusError as exc:
        logger.error("Errore da Open-Meteo: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Il servizio meteo ha restituito un errore. Riprova tra poco.",
        )
    except Exception as exc:
        logger.exception("Errore imprevisto in /api/weather: %s", exc)
        raise HTTPException(status_code=500, detail="Errore interno del server.")

    return weather


# ═══════════════════════════════════════════════════════════════
#  GET /api/dashboard/summary
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/dashboard/summary",
    response_model=DashboardSummaryResponse,
    summary="Snapshot meteo per la dashboard",
    description=(
        "Restituisce in un'unica risposta i dati essenziali di "
        "Milano, Roma, Napoli, Torino e delle macro-aree Nord/Centro/Sud. "
        "Ideale per popolare la home page senza fare richieste multiple."
    ),
)
async def get_dashboard_summary() -> DashboardSummaryResponse:
    """
    Recupera in parallelo i dati meteo di tutte le località della dashboard.

    Le chiamate a Open-Meteo vengono eseguite concorrentemente con
    asyncio.gather per minimizzare la latenza complessiva.
    """
    try:
        data = await get_dashboard_weather()
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Timeout nella comunicazione con il servizio meteo. Riprova tra poco.",
        )
    except httpx.HTTPStatusError as exc:
        logger.error("Errore da Open-Meteo nella dashboard: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Il servizio meteo ha restituito un errore. Riprova tra poco.",
        )
    except Exception as exc:
        logger.exception("Errore imprevisto in /api/dashboard/summary: %s", exc)
        raise HTTPException(status_code=500, detail="Errore interno del server.")

    return DashboardSummaryResponse(
        cities=data["cities"],
        areas=data["areas"],
    )