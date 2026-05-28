import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'
import './HomePage.css'

const todayForecast = [
  { city: 'Milano', weather: null, temp: null, rain: null },
  { city: 'Roma', weather: null, temp: null, rain: null },
  { city: 'Napoli', weather: null, temp: null, rain: null },
  { city: 'Torino', weather: null, temp: null, rain: null },
]

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

const mapAreas = [
  { name: 'Nord', status: null, temp: null },
  { name: 'Centro', status: null, temp: null },
  { name: 'Sud', status: null, temp: null },
]

// placeholders in attesa del backend
const currentWeather = {
  city: 'Milano',
  region: 'Lombardia',
  temperature: null,
  condition: null,
  wind: null,
  humidity: null,
  pressure: null,
}

const emptyValue = '--'

const tools = [
  {
    name: 'Satellite',
    description: 'Osserva nuvole e schiarite sull Italia.',
  },
  {
    name: 'Allerte',
    description: 'Segui le criticita previste nelle regioni.',
  },
  {
    name: 'Pollini',
    description: 'Consulta i livelli utili per le allergie.',
  },
  {
    name: 'Neve',
    description: 'Guarda quota neve e situazione in montagna.',
  },
  {
    name: 'Mari',
    description: 'Verifica vento, onde e condizioni marine.',
  },
]

const cities = [
  'Roma',
  'Milano',
  'Napoli',
  'Torino',
  'Palermo',
  'Genova',
  'Bologna',
  'Firenze',
  'Bari',
  'Venezia',
  'Verona',
  'Cagliari',
]

function HomePage() {
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

              <form className="search-box">
                <label htmlFor="city-search">Cerca localita</label>
                <div className="search-row">
                  <input
                    id="city-search"
                    name="city"
                    type="search"
                    placeholder="Cerca comune o localita"
                  />
                  <button type="submit">Cerca</button>
                </div>
              </form>
            </div>

            <article className="local-card" aria-label={`Meteo attuale a ${currentWeather.city}`}>
              <div className="local-card-header">
                <div>
                  <p className="kicker">Ora locale</p>
                  <h2>
                    {currentWeather.city}, {currentWeather.region}
                  </h2>
                </div>
                <span className="weather-symbol" aria-hidden="true" />
              </div>

              <div className="local-temp">
                <strong>{currentWeather.temperature ?? emptyValue}&deg;</strong>
                <span>{currentWeather.condition ?? 'Errore'}</span>
              </div>

              <div className="local-stats">
                <div className="stat">
                  <small>Vento</small>
                  <strong>{currentWeather.wind ?? emptyValue} km/h</strong>
                </div>
                <div className="stat">
                  <small>Umidita</small>
                  <strong>{currentWeather.humidity ?? emptyValue}%</strong>
                </div>
                <div className="stat">
                  <small>Pressione</small>
                  <strong>{currentWeather.pressure ?? emptyValue} hPa</strong>
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
              {mapAreas.map((area) => (
                <article className="area-card" key={area.name}>
                  <small>Area</small>
                  <strong>{area.name}</strong>
                  <span>{area.status ?? 'Errore'}</span>
                  <p>{area.temp ?? emptyValue}&deg;</p>
                </article>
              ))}
            </div>
          </article>

          <aside className="panel">
            <div className="section-title">
              <div>
                <p className="kicker">Oggi</p>
                <h2>Principali citta</h2>
              </div>
            </div>

            <div className="forecast-grid">
              {todayForecast.map((item) => (
                <article className="forecast-card" key={item.city}>
                  <small>{item.city}</small>
                  <strong>{item.temp ?? emptyValue}&deg;</strong>
                  <p>{item.weather ?? 'Errore'}</p>
                  <small>Pioggia {item.rain ?? emptyValue}%</small>
                </article>
              ))}
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
              <a className="tool-card" href="#strumenti" key={tool.name}>
                <span>{tool.name.slice(0, 1)}</span>
                <strong>{tool.name}</strong>
                <p>{tool.description}</p>
              </a>
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
            {cities.map((city) => (
              <a href="#previsioni" key={city}>
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