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
          <a href="#strumenti">Strumenti</a>
          <a href="#citta">Città</a>
        </nav>

        <div className="login-button"></div>
      </div>
    </header>
  )
}

export default Navbar