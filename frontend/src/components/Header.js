import React, { useState } from "react";
import { NavLink } from "react-router-dom";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState("en"); // domyślnie angielski

  const changeLanguage = (lang) => {
    setLanguage(lang);
    // tutaj później dodamy logikę zmiany języka w aplikacji
  };

  const flags = [
    { code: "en", src: "/flags/en.svg", alt: "English" },
    { code: "pl", src: "/flags/pl.svg", alt: "Polski" },
    { code: "es", src: "/flags/es.svg", alt: "Español" },
  ];

  return (
    <header className="site-header">
      <div className="nav container">
        <NavLink className="nav__brand" to="/">
          <img
            src="/logo.jpg"
            alt="Elepepe’s Sanctuary Logo"
            className="nav__logo-img"
          />
          <span className="nav__title">Elepepe’s Sanctuary</span>
        </NavLink>

        <button
          className={`nav__toggle ${menuOpen ? "is-open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="nav__toggle-bar"></span>
        </button>

        {/* MENU */}
        <ul className={`nav__menu ${menuOpen ? "is-open" : ""}`}>
          <li className="nav__item">
            <NavLink to="/" end>
              Home
            </NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/projects">Ongoing Projects</NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/request-support">Request Support</NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/success-stories">Success Stories</NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/about">About Us</NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/partnerships">Partnerships</NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/contact">Contact</NavLink>
          </li>
        </ul>

        {/* Flagi po prawej */}
        <div className="nav__lang">
          {flags
            .filter((f) => f.code !== language)
            .map((f) => (
              <button
                key={f.code}
                className="nav__lang-btn"
                onClick={() => changeLanguage(f.code)}
              >
                <img src={f.src} alt={f.alt} />
              </button>
            ))}
        </div>
      </div>
    </header>
  );
}

export default Header;
