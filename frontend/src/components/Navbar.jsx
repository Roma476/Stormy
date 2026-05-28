import './Navbar.css'

function Navbar() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="navbar-logo" href="/" aria-label="Stormy homepage">
          <span className="navbar-logo-symbol"><img src="/favicon.svg" alt="Stormy logo" /></span>
          <span>Stormy</span>
        </a>

        <nav className="main-nav" aria-label="Navigazione principale">
          <a href="#previsioni">Previsioni</a>
          <a href="#mappe">Aree</a>
          <a href="#strumenti">Strumenti</a>
          <a href="#citta">Citta</a>
        </nav>

        <div class="login-button"></div> {/* per spaziare (non toccare!)*/}
      </div>
    </header>
  )
}

export default Navbar