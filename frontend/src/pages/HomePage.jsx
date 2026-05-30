import { useEffect, useState } from 'react'
import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'
import './HomePage.css'
import ToolModal from '../components/ToolModal.jsx'

const daysIT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const forecastDays = Array.from({ length: 7 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() + i)
  const label = date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
  return { label, day: daysIT[date.getDay()] }
})

const emptyValue = '--'

const tools = [
  { name: 'Radar', description: 'Osserva le condizioni meteorologiche in tempo reale.' },
  { name: 'Allerte', description: 'Segui le criticita previste nelle regioni.' },
  { name: 'Pollini', description: 'Consulta i livelli utili per le allergie.' },
  { name: 'Neve', description: 'Guarda quota neve e situazione in montagna.' },
  { name: 'Mari', description: 'Verifica vento, onde e condizioni marine.' },
]

const citiesList = [
  'Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova',
  'Bologna', 'Firenze', 'Bari', 'Venezia', 'Verona', 'Cagliari',
]

const WMO_DESCRIPTIONS = {
  0: 'Cielo sereno', 1: 'Prevalentemente sereno', 2: 'Parzialmente nuvoloso',
  3: 'Coperto', 45: 'Nebbia', 48: 'Nebbia con brina', 51: 'Pioggerella leggera',
  53: 'Pioggerella moderata', 55: 'Pioggerella intensa', 61: 'Pioggia leggera',
  63: 'Pioggia moderata', 65: 'Pioggia intensa', 71: 'Neve leggera',
  73: 'Neve moderata', 75: 'Neve intensa', 77: 'Granuli di neve',
  80: 'Rovesci leggeri', 81: 'Rovesci moderati', 82: 'Rovesci violenti',
  85: 'Rovesci di neve', 86: 'Rovesci di neve intensi', 95: 'Temporale',
  96: 'Temporale con grandine leggera', 99: 'Temporale con grandine intensa',
}

const wmoDesc = (code) => WMO_DESCRIPTIONS[code] || 'Condizioni sconosciute'

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'
const CURRENT_PARAMS = 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,weather_code,is_day'
const DAILY_PARAMS = 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code'

const FEATURED_CITIES = [
  { id: 'milano', name: 'Milano', latitude: 45.4654, longitude: 9.1859, region: 'Lombardia' },
  { id: 'roma', name: 'Roma', latitude: 41.8955, longitude: 12.4823, region: 'Lazio' },
  { id: 'napoli', name: 'Napoli', latitude: 40.8522, longitude: 14.2681, region: 'Campania' },
  { id: 'torino', name: 'Torino', latitude: 45.0703, longitude: 7.6869, region: 'Piemonte' },
]

const MACRO_AREAS = [
  { id: 'nord', name: 'Nord Italia', latitude: 45.4654, longitude: 10.9333, region: 'Nord' },
  { id: 'centro', name: 'Centro Italia', latitude: 43.7228, longitude: 11.9668, region: 'Centro' },
  { id: 'sud', name: 'Sud Italia', latitude: 40.4958, longitude: 16.0002, region: 'Sud' },
]

async function fetchWeather(lat, lon) {
  const url = `${OPEN_METEO}?latitude=${lat}&longitude=${lon}&timezone=Europe/Rome&current=${CURRENT_PARAMS}&daily=${DAILY_PARAMS}&forecast_days=7&wind_speed_unit=kmh&precipitation_unit=mm`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Errore Open-Meteo')
  return res.json()
}

function parseCity(data, meta) {
  const c = data.current
  return {
    id: meta.id,
    name: meta.name,
    region: meta.region,
    temperature: c.temperature_2m,
    apparent_temperature: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    wind_speed: c.wind_speed_10m,
    wind_direction: c.wind_direction_10m,
    pressure: c.surface_pressure,
    weather_code: c.weather_code,
    weather_description: wmoDesc(c.weather_code),
    temp_max: data.daily.temperature_2m_max[0],
    temp_min: data.daily.temperature_2m_min[0],
  }
}

function HomePage() {
  const [citiesData, setCitiesData] = useState([])
  const [areasData, setAreasData] = useState([])
  const [mainCity, setMainCity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTool, setActiveTool] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [citiesResults, areasResults] = await Promise.allSettled([
          Promise.all(FEATURED_CITIES.map(c => fetchWeather(c.latitude, c.longitude).then(d => parseCity(d, c)))),
          Promise.all(MACRO_AREAS.map(a => fetchWeather(a.latitude, a.longitude).then(d => parseCity(d, a)))),
        ])

        const cities = citiesResults.status === 'fulfilled' ? citiesResults.value : []
        const areas = areasResults.status === 'fulfilled' ? areasResults.value : []

        setCitiesData(cities)
        setAreasData(areas)

        if (cities.length > 0) {
          const milano = cities.find(c => c.id === 'milano') || cities[0]
          setMainCity(milano)
        }
      } catch (error) {
        console.error('Errore dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  async function fetchCityWeather(cityName) {
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=it&format=json`)
      const geoData = await geoRes.json()
      if (!geoData.results || geoData.results.length === 0) {
        alert('Nessuna località trovata.')
        return false
      }
      const place = geoData.results[0]
      const data = await fetchWeather(place.latitude, place.longitude)
      const meta = { id: place.id, name: place.name, region: place.admin1 || place.country || 'Italia' }
      setMainCity(parseCity(data, meta))
      return true
    } catch (error) {
      console.error('Errore nel recupero dati:', error)
      alert('Errore nel caricamento del meteo.')
      return false
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    await fetchCityWeather(searchQuery)
    setSearchQuery('')
    setSearchLoading(false)
  }

  async function handleQuickSearch(e, cityName) {
    e.preventDefault()
    setSearchLoading(true)
    await fetchCityWeather(cityName)
    setSearchLoading(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToolClick = (toolName) => {
    setActiveTool(toolName)
  }

  return (
    <>
      <Navbar />

      <main className="page">
        <section className="hero-panel" id="previsioni">
          <div className="hero-content">
            <div>
              <p className="kicker">Previsioni meteo Italia</p>
              <h1>Meteo aggiornato per la tua citta</h1>
              <p className="hero-copy">
                Cerca una localita, controlla il tempo di oggi e confronta le
                previsioni per le prossime ore con allerte e aggiornamenti
                sulle principali citta italiane.
              </p>

              <form className="search-box" onSubmit={handleSearch}>
                <label htmlFor="city-search">Cerca localita</label>
                <div className="search-row">
                  <input
                    id="city-search"
                    name="city"
                    type="search"
                    placeholder="Cerca comune o localita"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" disabled={searchLoading}>
                    {searchLoading ? '...' : 'Cerca'}
                  </button>
                </div>
              </form>
            </div>

            <article className="local-card" aria-label="Meteo attuale">
              <div className="local-card-header">
                <div>
                  <p className="kicker">Ora locale</p>
                  <h2>
                    {mainCity ? `${mainCity.name}, ${mainCity.region}` : 'Caricamento...'}
                  </h2>
                </div>
                <span className="weather-symbol" aria-hidden="true" />
              </div>

              <div className="local-temp">
                <strong>{mainCity ? `${Math.round(mainCity.temperature)}` : emptyValue}&deg;</strong>
                <span>{mainCity ? mainCity.weather_description : '---'}</span>
              </div>

              <div className="local-stats">
                <div className="stat">
                  <small>Vento</small>
                  <strong>{mainCity ? Math.round(mainCity.wind_speed) : emptyValue} km/h</strong>
                </div>
                <div className="stat">
                  <small>Umidita</small>
                  <strong>{mainCity ? mainCity.humidity : emptyValue}%</strong>
                </div>
                <div className="stat">
                  <small>Pressione</small>
                  <strong>{mainCity ? Math.round(mainCity.pressure) : emptyValue} hPa</strong>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="section-grid" id="mappe">
          <article className="panel">
            <div className="section-title">
              <div>
                <p className="kicker">Italia</p>
                <h2>Previsioni della settimana</h2>
              </div>
              <a href="#citta">Tutte le localita</a>
            </div>

            <div className="tabs" aria-label="Giorni previsione">
              {forecastDays.map((day) => (
                <button className="tab-button" type="button" key={day.label}>
                  <span>{day.day}</span>
                  <strong>{day.label}</strong>
                </button>
              ))}
            </div>

            <div className="area-grid">
              {loading ? (
                <p>Caricamento macro-aree...</p>
              ) : (
                areasData.map((area) => (
                  <article className="area-card" key={area.id}>
                    <small>Area</small>
                    <strong>{area.name}</strong>
                    <span>{area.weather_description}</span>
                    <p>{Math.round(area.temperature)}&deg;</p>
                  </article>
                ))
              )}
            </div>
          </article>

          <aside className="panel">
            <div className="section-title">
              <div>
                <p className="kicker">Oggi</p>
                <h2>Principali citta</h2>
              </div>
            </div>

            {activeTool && <ToolModal toolName={activeTool} onClose={() => setActiveTool(null)} />}

            <div className="forecast-grid">
              {loading ? (
                <p>Caricamento città...</p>
              ) : (
                citiesData.slice(0, 4).map((item) => (
                  <article
                    className="forecast-card"
                    key={item.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setMainCity(item)}
                  >
                    <small>{item.name}</small>
                    <strong>{Math.round(item.temperature)}&deg;</strong>
                    <p>{item.weather_description}</p>
                    <small>Max: {Math.round(item.temp_max)}&deg; | Min: {Math.round(item.temp_min)}&deg;</small>
                  </article>
                ))
              )}
            </div>
          </aside>
        </section>

        <section className="panel" id="strumenti">
          <div className="section-title">
            <div>
              <p className="kicker">Approfondimenti</p>
              <h2>Dati e strumenti meteo</h2>
            </div>
          </div>

          <div className="tools-grid">
            {tools.map((tool) => (
              <div
                className="tool-card"
                key={tool.name}
                onClick={() => handleToolClick(tool.name)}
                style={{ cursor: 'pointer' }}
              >
                <span>{tool.name.slice(0, 1)}</span>
                <strong>{tool.name}</strong>
                <p>{tool.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel" id="citta">
          <div className="section-title">
            <div>
              <p className="kicker">Localita</p>
              <h2>Il tempo nelle principali citta italiane</h2>
            </div>
          </div>

          <div className="city-grid">
            {citiesList.map((city) => (
              <a
                href="#previsioni"
                key={city}
                onClick={(e) => handleQuickSearch(e, city)}
              >
                {city}
              </a>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default HomePage