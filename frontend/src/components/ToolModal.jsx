import { useEffect, useState } from 'react'

// ─── helpers ───────────────────────────────────────────────────────────────

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'
const AIR_QUALITY = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const MARINE = 'https://marine-api.open-meteo.com/v1/marine'

const wmoDesc = (code) => {
  const map = {
    0:'Sereno',1:'Prevalentemente sereno',2:'Parzialmente nuvoloso',3:'Coperto',
    45:'Nebbia',48:'Nebbia con brina',51:'Pioggerella leggera',53:'Pioggerella',
    55:'Pioggerella intensa',61:'Pioggia leggera',63:'Pioggia',65:'Pioggia intensa',
    71:'Neve leggera',73:'Neve',75:'Neve intensa',80:'Rovesci',81:'Rovesci moderati',
    82:'Rovesci violenti',95:'Temporale',96:'Temporale con grandine',99:'Grandine intensa',
  }
  return map[code] || 'N/D'
}

const windDir = (deg) => {
  const dirs = ['N','NE','E','SE','S','SO','O','NO']
  return dirs[Math.round(deg / 45) % 8]
}

// ─── sub-tools ─────────────────────────────────────────────────────────────

function SatelliteTool() {
  const [layer, setLayer] = useState('radar')

  const layers = [
    { key: 'radar', label: '🟢 Radar precipitazioni' },
    { key: 'satellite', label: '🛰️ Satellite' },
    { key: 'wind', label: '💨 Vento' },
    { key: 'temp', label: '🌡️ Temperatura' },
    { key: 'clouds', label: '☁️ Nuvolosità' },
  ]

  const windyUrl = `https://embed.windy.com/embed2.html?lat=42.0&lon=12.5&detailLat=41.9&detailLon=12.5&width=740&height=450&zoom=5&level=surface&overlay=${layer}&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {layers.map(l => (
          <button
            key={l.key}
            onClick={() => setLayer(l.key)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 700,
              background: layer === l.key ? '#0d75b8' : '#f5f9fc',
              color: layer === l.key ? 'white' : '#5e7083',
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
      <iframe
        key={layer}
        src={windyUrl}
        style={{ width: '100%', height: 450, border: 'none', borderRadius: 10 }}
        title="Windy mappa meteo"
        allowFullScreen
      />
      <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 8 }}>
        Mappa interattiva fornita da <a href="https://www.windy.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0d75b8' }}>Windy.com</a>
      </p>
    </div>
  )
}

function AllerteTool() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const areas = [
      { name: 'Nord Italia', lat: 45.4654, lon: 10.9333 },
      { name: 'Centro Italia', lat: 43.7228, lon: 11.9668 },
      { name: 'Sud Italia', lat: 40.4958, lon: 16.0002 },
      { name: 'Sicilia', lat: 37.5999, lon: 14.0154 },
      { name: 'Sardegna', lat: 40.1209, lon: 9.0129 },
    ]
    Promise.all(areas.map(a =>
      fetch(`${OPEN_METEO}?latitude=${a.lat}&longitude=${a.lon}&daily=precipitation_sum,wind_speed_10m_max,weather_code&forecast_days=3&timezone=Europe/Rome`)
        .then(r => r.json())
        .then(d => ({
          ...a,
          days: d.daily.time.map((t, i) => ({
            date: t,
            rain: d.daily.precipitation_sum[i],
            wind: d.daily.wind_speed_10m_max[i],
            wmo: d.daily.weather_code[i],
          }))
        }))
    )).then(results => { setData(results); setLoading(false) })
  }, [])

  const riskLevel = (rain, wind, wmo) => {
    const isThunder = [95, 96, 99].includes(wmo)
    if (isThunder || rain > 50 || wind > 80) return { label: 'Arancione', color: '#ff9800' }
    if (rain > 20 || wind > 60) return { label: 'Giallo', color: '#ffeb3b' }
    return { label: 'Verde', color: '#4caf50' }
  }

  if (loading) return <p style={{ color: '#5e7083' }}>Caricamento allerte...</p>

  return (
    <div>
      <p style={{ color: '#5e7083', marginBottom: 20 }}>
        Livello di rischio meteo per macro-area nelle prossime 72 ore, basato su precipitazioni, vento e temporali.
      </p>
      {data.map(area => (
        <div key={area.name} style={{ marginBottom: 16, background: '#f5f9fc', borderRadius: 8, padding: 16 }}>
          <div style={{ fontWeight: 850, color: '#122033', marginBottom: 12 }}>{area.name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {area.days.map(day => {
              const risk = riskLevel(day.rain, day.wind, day.wmo)
              const date = new Date(day.date)
              const label = date.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' })
              return (
                <div key={day.date} style={{ background: 'white', borderRadius: 6, padding: 12, borderLeft: `4px solid ${risk.color}` }}>
                  <div style={{ fontSize: '0.78rem', color: '#5e7083', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontWeight: 700, color: risk.color, marginBottom: 4 }}>{risk.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#5e7083' }}>{wmoDesc(day.wmo)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#5e7083', marginTop: 4 }}>
                    🌧 {day.rain.toFixed(0)} mm &nbsp; 💨 {day.wind.toFixed(0)} km/h
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function PollineTool() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cities = [
      { name: 'Milano', lat: 45.4654, lon: 9.1859 },
      { name: 'Roma', lat: 41.8955, lon: 12.4823 },
      { name: 'Napoli', lat: 40.8522, lon: 14.2681 },
      { name: 'Torino', lat: 45.0703, lon: 7.6869 },
      { name: 'Firenze', lat: 43.7696, lon: 11.2558 },
      { name: 'Palermo', lat: 38.1157, lon: 13.3615 },
    ]
    Promise.all(cities.map(c =>
      fetch(`${AIR_QUALITY}?latitude=${c.lat}&longitude=${c.lon}&current=alder_pollen,birch_pollen,grass_pollen,olive_pollen,ragweed_pollen&timezone=Europe/Rome`)
        .then(r => r.json())
        .then(d => ({ ...c, pollini: d.current }))
    )).then(results => { setData(results); setLoading(false) })
  }, [])

  const pollenLabel = (val) => {
    if (val === null || val === undefined) return { label: 'N/D', color: '#aaa' }
    if (val <= 10) return { label: 'Basso', color: '#4caf50' }
    if (val <= 30) return { label: 'Moderato', color: '#ffeb3b' }
    if (val <= 100) return { label: 'Alto', color: '#ff9800' }
    return { label: 'Molto alto', color: '#f44336' }
  }

  const pollenTypes = [
    { key: 'alder_pollen', name: 'Ontano' },
    { key: 'birch_pollen', name: 'Betulla' },
    { key: 'grass_pollen', name: 'Graminacee' },
    { key: 'olive_pollen', name: 'Olivo' },
    { key: 'ragweed_pollen', name: 'Ambrosia' },
  ]

  if (loading) return <p style={{ color: '#5e7083' }}>Caricamento dati pollini...</p>

  return (
    <div>
      <p style={{ color: '#5e7083', marginBottom: 20 }}>
        Concentrazione pollinica attuale per tipo nelle principali città. Utile per chi soffre di allergie stagionali.
      </p>
      {data.map(city => (
        <div key={city.name} style={{ marginBottom: 16, background: '#f5f9fc', borderRadius: 8, padding: 16 }}>
          <div style={{ fontWeight: 850, color: '#122033', marginBottom: 12 }}>{city.name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {pollenTypes.map(({ key, name }) => {
              const val = city.pollini?.[key]
              const { label, color } = pollenLabel(val)
              return (
                <div key={key} style={{ background: 'white', borderRadius: 6, padding: '8px 12px', minWidth: 100 }}>
                  <div style={{ fontSize: '0.75rem', color: '#5e7083' }}>{name}</div>
                  <div style={{ fontWeight: 700, color, fontSize: '0.9rem' }}>{label}</div>
                  {val !== null && val !== undefined && <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{val} grani/m³</div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function NeveTool() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const mountains = [
      { name: 'Courmayeur', lat: 45.7960, lon: 6.9693, alt: 1224 },
      { name: 'Cortina d\'Ampezzo', lat: 46.5404, lon: 12.1357, alt: 1224 },
      { name: 'Cervinia', lat: 45.9377, lon: 7.6300, alt: 2050 },
      { name: 'Sestriere', lat: 44.9595, lon: 6.8773, alt: 2035 },
      { name: 'Livigno', lat: 46.5370, lon: 10.1370, alt: 1816 },
      { name: 'Abetone', lat: 44.1435, lon: 10.6650, alt: 1388 },
    ]
    Promise.all(mountains.map(m =>
      fetch(`${OPEN_METEO}?latitude=${m.lat}&longitude=${m.lon}&current=temperature_2m,weather_code,snowfall&daily=snowfall_sum,snow_depth_max,temperature_2m_min,temperature_2m_max&forecast_days=5&timezone=Europe/Rome`)
        .then(r => r.json())
        .then(d => ({ ...m, current: d.current, daily: d.daily }))
    )).then(results => { setData(results); setLoading(false) })
  }, [])

  if (loading) return <p style={{ color: '#5e7083' }}>Caricamento dati neve...</p>

  return (
    <div>
      <p style={{ color: '#5e7083', marginBottom: 20 }}>
        Situazione neve nelle principali località montane italiane con previsioni per i prossimi 5 giorni.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {data.map(loc => (
          <div key={loc.name} style={{ background: '#f5f9fc', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 850, color: '#122033' }}>{loc.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#5e7083' }}>{loc.alt} m s.l.m.</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0d75b8' }}>{Math.round(loc.current.temperature_2m)}°</div>
                <div style={{ fontSize: '0.78rem', color: '#5e7083' }}>{wmoDesc(loc.current.weather_code)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {loc.daily.time.map((t, i) => {
                const date = new Date(t)
                const dayLabel = date.toLocaleDateString('it-IT', { weekday: 'short' })
                const snow = loc.daily.snowfall_sum[i]
                return (
                  <div key={t} style={{ minWidth: 48, textAlign: 'center', background: 'white', borderRadius: 6, padding: '8px 4px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#5e7083' }}>{dayLabel}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: snow > 0 ? '#0d75b8' : '#aaa', marginTop: 4 }}>
                      {snow > 0 ? `${snow.toFixed(0)} cm` : '—'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#5e7083', marginTop: 2 }}>
                      {Math.round(loc.daily.temperature_2m_min[i])}°/{Math.round(loc.daily.temperature_2m_max[i])}°
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MariTool() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const coasts = [
      { name: 'Liguria', lat: 44.1, lon: 8.9 },
      { name: 'Adriatico Nord', lat: 44.8, lon: 13.0 },
      { name: 'Adriatico Sud', lat: 41.5, lon: 17.5 },
      { name: 'Tirreno Nord', lat: 42.5, lon: 10.5 },
      { name: 'Tirreno Sud', lat: 38.5, lon: 15.5 },
      { name: 'Ionio', lat: 38.0, lon: 17.0 },
      { name: 'Canale di Sicilia', lat: 37.2, lon: 12.5 },
      { name: 'Mar di Sardegna', lat: 40.0, lon: 8.0 },
    ]
    Promise.all(coasts.map(c =>
      fetch(`${MARINE}?latitude=${c.lat}&longitude=${c.lon}&current=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height&timezone=Europe/Rome`)
        .then(r => r.json())
        .then(d => ({ ...c, ...d.current }))
        .catch(() => ({ ...c, wave_height: null }))
    )).then(results => { setData(results); setLoading(false) })
  }, [])

  const seaState = (height) => {
    if (height === null) return { label: 'N/D', color: '#aaa' }
    if (height < 0.5) return { label: 'Calmo', color: '#4caf50' }
    if (height < 1.25) return { label: 'Poco mosso', color: '#8bc34a' }
    if (height < 2.5) return { label: 'Mosso', color: '#ffeb3b' }
    if (height < 4) return { label: 'Molto mosso', color: '#ff9800' }
    return { label: 'Agitato', color: '#f44336' }
  }

  if (loading) return <p style={{ color: '#5e7083' }}>Caricamento dati marini...</p>

  return (
    <div>
      <p style={{ color: '#5e7083', marginBottom: 20 }}>
        Condizioni marine attuali nei principali bacini italiani: altezza onde, moto ondoso e stato del mare.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {data.map(sea => {
          const state = seaState(sea.wave_height)
          return (
            <div key={sea.name} style={{ background: '#f5f9fc', borderRadius: 8, padding: 16, borderTop: `4px solid ${state.color}` }}>
              <div style={{ fontWeight: 850, color: '#122033', marginBottom: 8 }}>{sea.name}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: state.color }}>
                {sea.wave_height !== null ? `${sea.wave_height.toFixed(1)} m` : 'N/D'}
              </div>
              <div style={{ fontWeight: 700, color: state.color, fontSize: '0.9rem', marginBottom: 8 }}>{state.label}</div>
              {sea.wave_period && <div style={{ fontSize: '0.78rem', color: '#5e7083' }}>Periodo: {sea.wave_period.toFixed(0)} s</div>}
              {sea.wave_direction && <div style={{ fontSize: '0.78rem', color: '#5e7083' }}>Direzione: {windDir(sea.wave_direction)}</div>}
              {sea.swell_wave_height !== null && sea.swell_wave_height !== undefined && (
                <div style={{ fontSize: '0.78rem', color: '#5e7083' }}>Swell: {sea.swell_wave_height.toFixed(1)} m</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── main modal ────────────────────────────────────────────────────────────

const TOOLS = {
  Radar : { title: '🛰️ Radar', component: SatelliteTool },
  Allerte: { title: '⚠️ Allerte Meteo', component: AllerteTool },
  Pollini: { title: '🌿 Pollini', component: PollineTool },
  Neve: { title: '❄️ Neve in montagna', component: NeveTool },
  Mari: { title: '🌊 Condizioni Marine', component: MariTool },
}

export default function ToolModal({ toolName, onClose }) {
  const tool = TOOLS[toolName]
  if (!tool) return null

  const Component = tool.component

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 99999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: 16, width: '100%', maxWidth: 780,
          maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid #cbdce8',
        }}>
          <h2 style={{ margin: 0, color: '#122033', fontSize: '1.3rem' }}>{tool.title}</h2>
          <button
            onClick={onClose}
            style={{
              background: '#f5f9fc', border: 'none', borderRadius: 8,
              width: 36, height: 36, cursor: 'pointer', fontSize: '1.1rem',
              color: '#5e7083', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <Component />
        </div>
      </div>
    </div>
  )
}