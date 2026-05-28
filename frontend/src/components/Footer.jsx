import './Footer.css'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <a className="footer-logo" href="/" aria-label="Stormy homepage">
          <span className="footer-logo-symbol">S</span>
          <span>Stormy</span>
        </a>
        <p>Previsioni e dati locali sempre a portata di mano.</p>
      </div>

      <div className="footer-columns">
        <div>
          <strong>Consulta</strong>
          <a href="#previsioni">Previsioni</a>
          <a href="#mappe">Aree italiane</a>
          <a href="#citta">Citta principali</a>
        </div>
        <div>
          <strong>Strumenti</strong>
          <a href="#strumenti">Allerte</a>
          <a href="#strumenti">Satellite</a>
          <a href="#strumenti">Mari e neve</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer