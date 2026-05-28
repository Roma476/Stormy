import httpx

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"


async def get_coordinates(city: str):
    city = city.strip()

    if len(city) < 2:
        return None

    params = {
        "name": city,
        "count": 1,
        "language": "it",
        "format": "json",
        "countryCode": "IT",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(GEOCODING_URL, params=params)
        response.raise_for_status()

    data = response.json()
    results = data.get("results", [])

    if not results:
        return None

    place = results[0]

    return {
        "id": place.get("id"),
        "name": place.get("name"),
        "latitude": place.get("latitude"),
        "longitude": place.get("longitude"),
        "country": place.get("country"),
        "country_code": place.get("country_code"),
        "region": place.get("admin1"),
        "timezone": place.get("timezone"),
    }