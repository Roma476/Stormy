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
  { name: 'Satellite', description: 'Osserva nuvole e schiarite sull Italia.' },
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

const HOURLY_PARAMS = 'temperature_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day'

async function fetchWeather(lat, lon) {
  const url = `${OPEN_METEO}?latitude=${lat}&longitude=${lon}&timezone=Europe/Rome&current=${CURRENT_PARAMS}&daily=${DAILY_PARAMS}&hourly=${HOURLY_PARAMS}&forecast_days=7&wind_speed_unit=kmh&precipitation_unit=mm`
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

const CDN = 'https://cdn.jsdelivr.net/npm/@meteocons/svg/fill'

function wmoIcon(code, isDay = 1) {
  const day = isDay ? 'day' : 'night'
  if (code === 0) return `${CDN}/clear-${day}.svg`
  if (code === 1) return `${CDN}/partly-cloudy-${day}.svg`
  if (code === 2) return `${CDN}/partly-cloudy-${day}.svg`
  if (code === 3) return `${CDN}/overcast-${day}.svg`
  if (code === 45 || code === 48) return `${CDN}/fog-${day}.svg`
  if (code >= 51 && code <= 55) return `${CDN}/drizzle.svg`
  if (code >= 61 && code <= 65) return `${CDN}/rain.svg`
  if (code >= 71 && code <= 77) return `${CDN}/snow.svg`
  if (code >= 80 && code <= 82) return `${CDN}/rain-${day}.svg`
  if (code >= 85 && code <= 86) return `${CDN}/snow-${day}.svg`
  if (code === 95) return `${CDN}/thunderstorms-${day}.svg`
  if (code === 96 || code === 99) return `${CDN}/thunderstorms-${day}-hail.svg`
  return `${CDN}/partly-cloudy-${day}.svg`
}

function windDirLabel(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO']
  return dirs[Math.round(deg / 22.5) % 16]
}

function HomePage() {
  const [citiesData, setCitiesData] = useState([])
  const [areasData, setAreasData] = useState([])
  const [mainCity, setMainCity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTool, setActiveTool] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)
  const [forecast, setForecast] = useState(null)
  const [hourly, setHourly] = useState(null)

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
          const f = await fetchWeather(milano.latitude || 45.4654, milano.longitude || 9.1859)
          setForecast(f.daily)
          setHourly(f.hourly)
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
      setForecast(data.daily)
      setHourly(data.hourly)
      setSelectedDay(0)
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

        <section className="section" id="mappe">
          <article className="panel" style={{ width: '100%' }}>
            <div className="section-title">
              <div>
                <p className="kicker">{mainCity ? mainCity.name : 'Italia'}</p>
                <h2>Previsioni della settimana</h2>
              </div>
              <a href="#citta">Tutte le localita</a>
            </div>


            {forecast && hourly && mainCity ? (() => {
              // hourly rows for selected day
              const dayStart = selectedDay * 24
              const dayEnd = dayStart + 24
              const hours = Array.from({ length: 24 }, (_, h) => ({
                hour: h,
                time: hourly.time[dayStart + h],
                temp: hourly.temperature_2m[dayStart + h],
                rain: hourly.precipitation[dayStart + h],
                wmo: hourly.weather_code[dayStart + h],
                wind: hourly.wind_speed_10m[dayStart + h],
                windDir: hourly.wind_direction_10m[dayStart + h],
                isDay: hourly.is_day[dayStart + h],
              }))

              return (
                <div style={{ marginTop: 16 }}>
                  {/* 7-day strip */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
                    {forecast.time.map((t, i) => {
                      const date = new Date(t)
                      const dayLabel = i === 0 ? 'Oggi' : i === 1 ? 'Domani' : date.toLocaleDateString('it-IT', { weekday: 'short' })
                      const dateLabel = date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
                      const isSelected = selectedDay === i
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedDay(i)}
                          style={{
                            minWidth: 80, flex: '0 0 auto', border: 'none', borderRadius: 10, padding: '10px 8px',
                            cursor: 'pointer', textAlign: 'center',
                            background: isSelected ? '#0d75b8' : '#f5f9fc',
                            color: isSelected ? 'white' : '#122033',
                            outline: 'none',
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 4 }}>{dayLabel}</div>
                          <div style={{ fontSize: '0.7rem', color: isSelected ? 'rgba(255,255,255,0.75)' : '#5e7083', marginBottom: 6 }}>{dateLabel}</div>
                          <img
                            src={wmoIcon(forecast.weather_code[i], 1)}
                            alt={wmoDesc(forecast.weather_code[i])}
                            style={{ width: 36, height: 36, display: 'block', margin: '0 auto 6px' }}
                          />
                          <div style={{ fontSize: '0.82rem', fontWeight: 900 }}>{Math.round(forecast.temperature_2m_max[i])}°</div>
                          <div style={{ fontSize: '0.75rem', color: isSelected ? 'rgba(255,255,255,0.7)' : '#5e7083' }}>{Math.round(forecast.temperature_2m_min[i])}°</div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Hourly table */}
                  <div style={{ background: '#f5f9fc', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '48px 44px 1fr 72px 72px 90px',
                      padding: '8px 16px', background: '#e4eef5',
                      fontSize: '0.72rem', fontWeight: 850, textTransform: 'uppercase', color: '#5e7083',
                    }}>
                      <span>Ora</span>
                      <span></span>
                      <span>Condizioni</span>
                      <span style={{ textAlign: 'right' }}>Temp</span>
                      <span style={{ textAlign: 'right' }}>Pioggia</span>
                      <span style={{ textAlign: 'right' }}>Vento</span>
                    </div>
                    {hours.map((h) => (
                      <div
                        key={h.hour}
                        style={{
                          display: 'grid', gridTemplateColumns: '48px 44px 1fr 72px 72px 90px',
                          padding: '10px 16px', alignItems: 'center',
                          borderBottom: '1px solid #e4eef5',
                          background: h.hour % 2 === 0 ? 'white' : '#f5f9fc',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5e7083' }}>
                          {String(h.hour).padStart(2, '0')}:00
                        </span>
                        <img
                          src={wmoIcon(h.wmo, h.isDay)}
                          alt={wmoDesc(h.wmo)}
                          style={{ width: 30, height: 30 }}
                        />
                        <span style={{ fontSize: '0.82rem', color: '#122033' }}>{wmoDesc(h.wmo)}</span>
                        <span style={{ textAlign: 'right', fontWeight: 900, fontSize: '1rem', color: '#0d75b8' }}>
                          {Math.round(h.temp)}°
                        </span>
                        <span style={{ textAlign: 'right', fontSize: '0.82rem', color: h.rain > 0 ? '#0d75b8' : '#aaa' }}>
                          {h.rain.toFixed(1)} mm
                        </span>
                        <span style={{ textAlign: 'right', fontSize: '0.82rem', color: '#5e7083' }}>
                          {Math.round(h.wind)} km/h {windDirLabel(h.windDir)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })() : (
              <p style={{ color: '#5e7083', marginTop: 16 }}>Caricamento previsioni...</p>
            )}
          </article>

          
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