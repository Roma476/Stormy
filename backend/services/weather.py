# services/weather.py
# Funzioni asincrone per interrogare l'API Open-Meteo (gratuita, senza API key).
# Documentazione ufficiale: https://open-meteo.com/en/docs

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from data.featured_cities import ALL_DASHBOARD_LOCATIONS, CityCoords
from models.schemas import (
    CurrentWeather,
    DailyForecast,
    MiniWeather,
    WeatherResponse,
    wmo_to_description,
)

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
#  Costanti Open-Meteo
# ─────────────────────────────────────────────
OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"

# Parametri richiesti per il meteo corrente
CURRENT_PARAMS = ",".join([
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "wind_speed_10m",
    "wind_direction_10m",
    "surface_pressure",
    "weather_code",
    "is_day",
])

# Parametri richiesti per le previsioni giornaliere
DAILY_PARAMS = ",".join([
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "weather_code",
])

# Timeout in secondi per le chiamate HTTP
REQUEST_TIMEOUT = 10.0


# ═══════════════════════════════════════════════════════════════
#  FUNZIONE INTERNA: chiamata grezza all'API
# ═══════════════════════════════════════════════════════════════

async def _fetch_open_meteo(
    client: httpx.AsyncClient,
    latitude: float,
    longitude: float,
    timezone: str = "Europe/Rome",
) -> dict[str, Any]:
    """
    Esegue la chiamata HTTP a Open-Meteo per una singola coordinata.
    Restituisce il JSON grezzo oppure solleva un'eccezione in caso di errore.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "timezone": timezone,
        "current": CURRENT_PARAMS,
        "daily": DAILY_PARAMS,
        "forecast_days": 7,
        "wind_speed_unit": "kmh",      # Vento in km/h
        "precipitation_unit": "mm",
    }

    try:
        response = await client.get(
            OPEN_METEO_BASE_URL,
            params=params,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()

    except httpx.TimeoutException:
        logger.error("Timeout su Open-Meteo per lat=%s lon=%s", latitude, longitude)
        raise
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Errore HTTP %s da Open-Meteo: %s",
            exc.response.status_code,
            exc.response.text,
        )
        raise


# ═══════════════════════════════════════════════════════════════
#  PARSING: JSON grezzo → modelli Pydantic
# ═══════════════════════════════════════════════════════════════

def _parse_current(raw: dict[str, Any]) -> CurrentWeather:
    """Converte la sezione 'current' del JSON in un modello CurrentWeather."""
    c = raw["current"]
    return CurrentWeather(
        temperature=c["temperature_2m"],
        feels_like=c.get("apparent_temperature"),
        humidity=int(c["relative_humidity_2m"]),
        wind_speed=c["wind_speed_10m"],
        wind_direction=int(c["wind_direction_10m"]),
        pressure=c["surface_pressure"],
        weather_code=c["weather_code"],
        weather_description=wmo_to_description(c["weather_code"]),
        is_day=bool(c["is_day"]),
    )


def _parse_daily(raw: dict[str, Any]) -> list[DailyForecast]:
    """Converte la sezione 'daily' del JSON in una lista di DailyForecast."""
    daily = raw["daily"]
    forecasts: list[DailyForecast] = []

    for i, day_str in enumerate(daily["time"]):
        code = daily["weather_code"][i]
        forecasts.append(
            DailyForecast(
                date=day_str,  # Pydantic converte la stringa ISO in date
                temp_max=daily["temperature_2m_max"][i],
                temp_min=daily["temperature_2m_min"][i],
                precipitation=daily["precipitation_sum"][i] or 0.0,
                weather_code=code,
                weather_description=wmo_to_description(code),
            )
        )

    return forecasts


# ═══════════════════════════════════════════════════════════════
#  FUNZIONE PUBBLICA 1: meteo completo per coordinate singole
# ═══════════════════════════════════════════════════════════════

async def get_weather_by_coords(
    latitude: float,
    longitude: float,
    city_name: str = "Posizione",
    timezone: str = "Europe/Rome",
) -> WeatherResponse:
    """
    Recupera meteo corrente + previsioni 7 giorni per una coordinata.

    Args:
        latitude:  Latitudine WGS-84.
        longitude: Longitudine WGS-84.
        city_name: Nome da includere nella risposta (es. "Roma").
        timezone:  Fuso orario IANA (default: Europe/Rome).

    Returns:
        WeatherResponse con dati correnti e forecast.

    Raises:
        httpx.HTTPError: in caso di problemi di rete o risposte non-2xx.
    """
    async with httpx.AsyncClient() as client:
        raw = await _fetch_open_meteo(client, latitude, longitude, timezone)

    current = _parse_current(raw)
    forecast = _parse_daily(raw)

    return WeatherResponse(
        city_name=city_name,
        latitude=latitude,
        longitude=longitude,
        timezone=raw.get("timezone", timezone),
        current=current,
        forecast=forecast,
    )


# ═══════════════════════════════════════════════════════════════
#  FUNZIONE PUBBLICA 2: snapshot mini per la dashboard
# ═══════════════════════════════════════════════════════════════

async def _fetch_mini_weather(
    client: httpx.AsyncClient,
    location: CityCoords,
) -> MiniWeather:
    """
    Recupera i dati essenziali per una singola card della dashboard.
    Funzione interna usata in gather.
    """
    raw = await _fetch_open_meteo(
        client,
        latitude=location["latitude"],
        longitude=location["longitude"],
        timezone=location["timezone"],
    )

    c = raw["current"]
    daily = raw["daily"]

    # Temperatura massima e minima del giorno corrente (indice 0)
    temp_max = daily["temperature_2m_max"][0]
    temp_min = daily["temperature_2m_min"][0]
    code = c["weather_code"]

    return MiniWeather(
        id=location["id"],
        name=location["name"],
        region=location["region"],
        latitude=location["latitude"],
        longitude=location["longitude"],
        temperature=c["temperature_2m"],
        temp_max=temp_max,
        temp_min=temp_min,
        weather_code=code,
        weather_description=wmo_to_description(code),
        wind_speed=c["wind_speed_10m"],
        humidity=int(c["relative_humidity_2m"]),
        is_day=bool(c["is_day"]),
    )


async def get_dashboard_weather() -> dict[str, list[MiniWeather]]:
    """
    Recupera i dati meteo essenziali per tutte le località
    della dashboard in modo sequenziale (con pause) per evitare il blocco 429.
    """
    results = []
    
    async with httpx.AsyncClient() as client:
        # Iteriamo su ogni location una alla volta
        for slug, location in ALL_DASHBOARD_LOCATIONS.items():
            try:
                # Pausa di 200ms per non intasare l'API di Open-Meteo
                await asyncio.sleep(0.2)
                
                # Chiamiamo la funzione singola
                weather_data = await _fetch_mini_weather(client, location)
                results.append(weather_data)
            except Exception as e:
                logger.error(f"Errore nel recupero dati per {location.get('name')}: {e}")
                # Continuiamo con la città successiva anche se una fallisce
                continue

    # Creiamo un dizionario temporaneo per mappare slug -> risultato
    # Nota: ALL_DASHBOARD_LOCATIONS.keys() mantiene l'ordine di inserimento
    slug_to_weather = dict(zip(ALL_DASHBOARD_LOCATIONS.keys(), results))

    from data.featured_cities import FEATURED_CITIES, MACRO_AREAS

    cities = [slug_to_weather[slug] for slug in FEATURED_CITIES if slug in slug_to_weather]
    areas = [slug_to_weather[slug] for slug in MACRO_AREAS if slug in slug_to_weather]

    return {"cities": cities, "areas": areas}