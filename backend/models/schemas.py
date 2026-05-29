# models/schemas.py
# Modelli Pydantic v2 per la validazione e la serializzazione
# di tutte le risposte del backend meteo.

from __future__ import annotations

import datetime as dt
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ═══════════════════════════════════════════════════════════════
#  GEOCODING / RICERCA CITTÀ
# ═══════════════════════════════════════════════════════════════

class CityResult(BaseModel):
    """Singolo risultato restituito dall'endpoint /api/search."""

    # FIX: Cambiato da str a int per accettare gli ID nativi numerici di Open-Meteo
    id: int = Field(..., description="Identificatore univoco della città")
    name: str = Field(..., description="Nome della città")
    latitude: float = Field(..., description="Latitudine WGS-84")
    longitude: float = Field(..., description="Longitudine WGS-84")
    country: str = Field(..., description="Nome del paese")
    country_code: str = Field(..., description="Codice ISO 3166-1 alpha-2 del paese")
    region: Optional[str] = Field(None, description="Regione o stato")
    timezone: Optional[str] = Field(None, description="Fuso orario IANA")


class SearchResponse(BaseModel):
    """Risposta completa dell'endpoint GET /api/search."""

    results: list[CityResult] = Field(
        default_factory=list,
        description="Lista di città corrispondenti alla query",
    )
    query: str = Field(..., description="Stringa di ricerca originale")


# ═══════════════════════════════════════════════════════════════
#  METEO CORRENTE
# ═══════════════════════════════════════════════════════════════

class CurrentWeather(BaseModel):
    """Condizioni meteo nell'istante corrente."""

    temperature: float = Field(..., description="Temperatura attuale in °C")
    feels_like: Optional[float] = Field(None, description="Temperatura percepita in °C")
    humidity: int = Field(..., description="Umidità relativa in %", ge=0, le=100)
    wind_speed: float = Field(..., description="Velocità del vento in km/h")
    wind_direction: int = Field(..., description="Direzione del vento in gradi (0-360)")
    pressure: float = Field(..., description="Pressione atmosferica in hPa")
    weather_code: int = Field(..., description="Codice WMO del fenomeno meteorologico")
    weather_description: str = Field(..., description="Descrizione testuale del tempo")
    is_day: bool = Field(..., description="True se è giorno, False se è notte")

    @field_validator("wind_direction")
    @classmethod
    def clamp_direction(cls, v: int) -> int:
        """Normalizza la direzione del vento nell'intervallo 0-360."""
        return v % 360


# ═══════════════════════════════════════════════════════════════
#  PREVISIONI GIORNALIERE
# ═══════════════════════════════════════════════════════════════

class DailyForecast(BaseModel):
    """Previsione per un singolo giorno."""

    date: dt.date = Field(..., description="Data della previsione (YYYY-MM-DD)")
    temp_max: float = Field(..., description="Temperatura massima in °C")
    temp_min: float = Field(..., description="Temperatura minima in °C")
    precipitation: float = Field(..., description="Precipitazioni totali in mm", ge=0)
    weather_code: int = Field(..., description="Codice WMO presumibile del giorno")
    weather_description: str = Field(..., description="Descrizione testuale del tempo")


# ═══════════════════════════════════════════════════════════════
#  RISPOSTA METEO COMPLETA  (endpoint /api/weather)
# ═══════════════════════════════════════════════════════════════

class WeatherResponse(BaseModel):
    """Risposta completa: meteo attuale + forecast 7 giorni."""

    city_name: str = Field(..., description="Nome della città o area")
    latitude: float
    longitude: float
    timezone: str = Field(..., description="Fuso orario IANA della località")
    current: CurrentWeather
    forecast: list[DailyForecast] = Field(
        ...,
        description="Previsioni giornaliere (fino a 7 giorni)",
        max_length=7,
    )


# ═══════════════════════════════════════════════════════════════
#  DASHBOARD SUMMARY  (endpoint /api/dashboard/summary)
# ═══════════════════════════════════════════════════════════════

class MiniWeather(BaseModel):
    """Snapshot meteo essenziale per una card della dashboard."""

    # FIX: Cambiato in int | str (o Union) per accettare sia gli ID numerici delle città 
    # che gli eventuali slug stringa delle macro-aree ("nord", "centro", "sud") senza rompersi.
    id: int | str = Field(..., description="Identificatore o slug della località")
    name: str = Field(..., description="Nome visualizzato")
    region: str = Field(..., description="Regione o macro-area")
    latitude: float
    longitude: float
    temperature: float = Field(..., description="Temperatura attuale in °C")
    temp_max: float = Field(..., description="Massima giornaliera in °C")
    temp_min: float = Field(..., description="Minima giornaliera in °C")
    weather_code: int = Field(..., description="Codice WMO corrente")
    weather_description: str = Field(..., description="Descrizione testuale")
    wind_speed: float = Field(..., description="Vento in km/h")
    humidity: int = Field(..., description="Umidità in %")
    is_day: bool


class DashboardSummaryResponse(BaseModel):
    """Risposta aggregata della dashboard: città + macro-aree."""

    cities: list[MiniWeather] = Field(
        ..., description="Dati delle città principali (Milano, Roma, Napoli, Torino)"
    )
    areas: list[MiniWeather] = Field(
        ..., description="Dati delle macro-aree (Nord, Centro, Sud)"
    )


# ═══════════════════════════════════════════════════════════════
#  UTILITY: mappatura codici WMO → descrizione italiana
# ═══════════════════════════════════════════════════════════════

WMO_DESCRIPTIONS: dict[int, str] = {
    0: "Cielo sereno",
    1: "Prevalentemente sereno",
    2: "Parzialmente nuvoloso",
    3: "Coperto",
    45: "Nebbia",
    48: "Nebbia con brina",
    51: "Pioggerella leggera",
    53: "Pioggerella moderata",
    55: "Pioggerella intensa",
    61: "Pioggia leggera",
    63: "Pioggia moderata",
    65: "Pioggia intensa",
    71: "Neve leggera",
    73: "Neve moderata",
    75: "Neve intensa",
    77: "Granuli di neve",
    80: "Rovesci leggeri",
    81: "Rovesci moderati",
    82: "Rovesci violenti",
    85: "Rovesci di neve",
    86: "Rovesci di neve intensi",
    95: "Temporale",
    96: "Temporale con grandine leggera",
    99: "Temporale con grandine intensa",
}


def wmo_to_description(code: int) -> str:
    """Converte un codice WMO nella descrizione italiana corrispondente."""
    return WMO_DESCRIPTIONS.get(code, "Condizioni sconosciute")