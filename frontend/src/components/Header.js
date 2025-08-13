import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Header() {
  const { t, i18n } = useTranslation("header");
  const [menuOpen, setMenuOpen] = useState(false);

  // (opcjonalnie) zapamiętaj język w localStorage
  useEffect(() => {
    const saved = localStorage.getItem("lng");
    if (saved && saved !== i18n.language) i18n.changeLanguage(saved);
  }, [i18n]);
  useEffect(() => {
    localStorage.setItem("lng", i18n.language);
  }, [i18n.language]);

  const flags = [
    { code: "en", src: "/flags/en.svg", alt: "English" },
    { code: "pl", src: "/flags/pl.svg", alt: "Polski" },
    { code: "es", src: "/flags/es.svg", alt: "Español" },
  ];

  const changeLanguage = (lng) => i18n.changeLanguage(lng);

  return (
    <header className="site-header">
      <div className="nav container">
        <NavLink
          className="nav__brand"
          to="/"
          onClick={() => setMenuOpen(false)}
        >
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

        <ul className={`nav__menu ${menuOpen ? "is-open" : ""}`}>
          <li className="nav__item">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>
              {t("nav.home")}
            </NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/projects" onClick={() => setMenuOpen(false)}>
              {t("nav.projects")}
            </NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/request-support" onClick={() => setMenuOpen(false)}>
              {t("nav.requestSupport")}
            </NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/success-stories" onClick={() => setMenuOpen(false)}>
              {t("nav.successStories")}
            </NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/about" onClick={() => setMenuOpen(false)}>
              {t("nav.about")}
            </NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/partnerships" onClick={() => setMenuOpen(false)}>
              {t("nav.partnerships")}
            </NavLink>
          </li>
          <li className="nav__item">
            <NavLink to="/contact" onClick={() => setMenuOpen(false)}>
              {t("nav.contact")}
            </NavLink>
          </li>
        </ul>

        <div className="nav__lang">
          {flags
            .filter((f) => f.code !== i18n.language)
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
