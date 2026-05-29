# data/featured_cities.py
# Coordinate fisse delle città principali e delle macro-aree italiane.
# Usate per la dashboard iniziale: evitano chiamate al geocoding e
# garantiscono risposte coerenti indipendentemente dall'API esterna.

from typing import TypedDict


class CityCoords(TypedDict):
    id: str           # Identificatore slug usato come chiave nelle risposte
    name: str         # Nome visualizzato nel frontend
    latitude: float
    longitude: float
    timezone: str     # Fuso orario IANA (Open-Meteo lo richiede)
    region: str       # Regione/area geografica descrittiva


# ─────────────────────────────────────────────
#  CITTÀ PRINCIPALI
# ─────────────────────────────────────────────
FEATURED_CITIES: dict[str, CityCoords] = {
    "milano": {
        "id": "milano",
        "name": "Milano",
        "latitude": 45.4654,
        "longitude": 9.1859,
        "timezone": "Europe/Rome",
        "region": "Lombardia",
    },
    "roma": {
        "id": "roma",
        "name": "Roma",
        "latitude": 41.8955,
        "longitude": 12.4823,
        "timezone": "Europe/Rome",
        "region": "Lazio",
    },
    "napoli": {
        "id": "napoli",
        "name": "Napoli",
        "latitude": 40.8522,
        "longitude": 14.2681,
        "timezone": "Europe/Rome",
        "region": "Campania",
    },
    "torino": {
        "id": "torino",
        "name": "Torino",
        "latitude": 45.0703,
        "longitude": 7.6869,
        "timezone": "Europe/Rome",
        "region": "Piemonte",
    },
}

# ─────────────────────────────────────────────
#  MACRO-AREE GEOGRAFICHE
#  Le coordinate puntano al centroide approssimativo di ogni area.
# ─────────────────────────────────────────────
MACRO_AREAS: dict[str, CityCoords] = {
    "nord": {
        "id": "nord",
        "name": "Nord Italia",
        "latitude": 45.4654,   # centroide Po Valley
        "longitude": 10.9333,
        "timezone": "Europe/Rome",
        "region": "Nord",
    },
    "centro": {
        "id": "centro",
        "name": "Centro Italia",
        "latitude": 43.7228,   # centroide Toscana/Umbria
        "longitude": 11.9668,
        "timezone": "Europe/Rome",
        "region": "Centro",
    },
    "sud": {
        "id": "sud",
        "name": "Sud Italia",
        "latitude": 40.4958,   # centroide Basilicata/Calabria
        "longitude": 16.0002,
        "timezone": "Europe/Rome",
        "region": "Sud",
    },
}

# Unione comoda per iterare su tutto in un'unica chiamata
ALL_DASHBOARD_LOCATIONS: dict[str, CityCoords] = {
    **FEATURED_CITIES,
    **MACRO_AREAS,
}