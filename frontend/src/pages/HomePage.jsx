import { useEffect, useState } from 'react'
import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'
import './HomePage.css'

const daysIT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const forecastDays = Array.from({ length: 7 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() + i)

  const label = date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
  })

  return {
    label,
    day: daysIT[date.getDay()],
  }
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

function HomePage() {
  const [citiesData, setCitiesData] = useState([])
  const [areasData, setAreasData] = useState([])
  const [mainCity, setMainCity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTool, setActiveTool] = useState(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

  // Caricamento iniziale dei dati della dashboard
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch(`${baseUrl}/dashboard/summary`)
        if (!response.ok) throw new Error('Errore nel recupero dati dal server')
        
        const data = await response.json()
        setCitiesData(data.cities || [])
        setAreasData(data.areas || [])
        
        if (data.cities && data.cities.length > 0) {
          const milano = data.cities.find(c => c.name.toLowerCase() === 'milano') || data.cities[0]
          setMainCity(milano)
        }
        setLoading(false)
      } catch (error) {
        console.error('Errore API Dashboard:', error)
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [baseUrl])

  // Esegue la ricerca della città
  // Esegue la ricerca della città gestendo correttamente la risposta del backend
  async function fetchCityWeather(cityName) {
    try {
      const searchRes = await fetch(`${baseUrl}/search?q=${encodeURIComponent(cityName)}`)
      if (!searchRes.ok) throw new Error('Errore nella ricerca della località')
      
      const searchData = await searchRes.json()
      
      // FIX CONTROLLO DATI: Gestisce sia se searchData è già un array, sia se contiene l'oggetto .results
      let results = []
      if (Array.isArray(searchData)) {
        results = searchData
      } else if (searchData && Array.isArray(searchData.results)) {
        results = searchData.results
      }
      
      if (results.length > 0) {
        const targetCity = results[0]
        
        // Recupera il meteo usando lat, lon e il nome corretto della città
        const weatherRes = await fetch(
          `${baseUrl}/weather?lat=${targetCity.latitude}&lon=${targetCity.longitude}&name=${encodeURIComponent(targetCity.name)}`
        )
        if (!weatherRes.ok) throw new Error('Errore meteo')
        
        const weatherData = await weatherRes.json()
        
        // Aggiorna lo stato per la card Hero principale
        setMainCity({
          name: weatherData.city_name,
          region: targetCity.region || targetCity.country || 'Italia',
          temperature: weatherData.current.temperature,
          weather_description: weatherData.current.weather_description,
          wind_speed: weatherData.current.wind_speed,
          humidity: weatherData.current.humidity,
        })
        return true
      } else {
        alert('Nessuna località trovata con questo nome.')
        return false
      }
    } catch (error) {
      console.error('Errore nel recupero dati:', error)
      alert('Si è verificato un errore nel caricamento del meteo.')
      return false
    }
  }

  // Gestore del form di ricerca manuale
  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearchLoading(true) // <--- Ora impostato correttamente a true all'avvio
    await fetchCityWeather(searchQuery)
    setSearchQuery('')
    setSearchLoading(false)
  }

  // Gestore dei click rapidi sulla lista in basso
  async function handleQuickSearch(e, cityName) {
    e.preventDefault() // Blocca il jump dell'ancora che rompeva il flusso
    setSearchLoading(true)
    await fetchCityWeather(cityName)
    setSearchLoading(false)
    // Scollamento fluido verso l'alto per vedere il risultato
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToolClick = async (toolName) => {
    setActiveTool(toolName);
    
    // Esempio: se clicchi "Allerte", chiami un endpoint dedicato
    if (toolName === "Allerte") {
      try {
        const response = await fetch(`${baseUrl}/allerte`);
        const data = await response.json();
        // Qui aggiorneresti lo stato per mostrare i dati reali nella modale
        console.log("Dati allerte ricevuti:", data);
      } catch (err) {
        console.error("Errore nel caricamento allerte:", err);
      }
    }
  };

  

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

            <article className="local-card" aria-label={`Meteo attuale`}>
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
                  <strong>{emptyValue} hPa</strong>
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

            {activeTool && (
              <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                  backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
                  justifyContent: 'center', alignItems: 'center', zIndex: 99999
              }} onClick={() => setActiveTool(null)}>
                <div style={{
                  backgroundColor: 'white', padding: '50px', borderRadius: '20px',
                  textAlign: 'center', color: 'black', fontWeight: 'bold'
                }} onClick={e => e.stopPropagation()}>
                  <h2>Stai usando: {activeTool}</h2>
                  <p>Questa funzione sarà disponibile a breve!</p>
                  <button onClick={() => setActiveTool(null)} style={{ padding: '10px 20px', cursor: 'pointer' }}>Chiudi</button>
                </div>
              </div>
        )}

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