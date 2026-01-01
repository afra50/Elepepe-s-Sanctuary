import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaFacebook } from "react-icons/fa";

function Footer() {
  const { t, i18n } = useTranslation("footer");
  const currentYear = new Date().getFullYear();

  // Pobieramy aktualny język (np. 'pl', 'en', 'es')
  // Jeśli język jest złożony (np. 'en-US'), bierzemy tylko pierwszą część
  const currentLang = (i18n.language || "pl").split("-")[0];

  // Helper do pobierania ścieżki regulaminu
  const getTermsLink = () => {
    switch (currentLang) {
      case "en":
        return "/docs/terms_conditions.pdf";
      case "es":
        return "/docs/terminos_condiciones.pdf";
      case "pl":
      default:
        return "/docs/regulamin.pdf";
    }
  };

  // Helper do pobierania ścieżki polityki prywatności
  const getPrivacyLink = () => {
    switch (currentLang) {
      case "en":
        return "/docs/policy.pdf";
      case "es":
        return "/docs/politica.pdf";
      case "pl":
      default:
        return "/docs/polityka.pdf";
    }
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="top-footer">
          <div className="footer-column brand-column">
            <NavLink to="/">
              <h4 className="brand-name">Elepepe's Sanctuary</h4>
              <img
                className="logo"
                alt="Elepepe's Sanctuary Logo"
                src="/logo-removebg.png"
              />
            </NavLink>
          </div>

          <div className="footer-column">
            <h4>{t("columns.info")}</h4>
            <ul className="footer-menu">
              <li className="menu-item">
                <NavLink to="/about">{t("links.about")}</NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/partnerships">{t("links.partnerships")}</NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/contact">{t("links.contact")}</NavLink>
              </li>
            </ul>

            <a
              href="https://www.facebook.com/profile.php?id=61580241488306"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebook />
            </a>
          </div>

          <div className="footer-column info-column">
            <h4>{t("columns.foundation")}</h4>
            <div className="foundation-data">
              <p>Elepepe's Sanctuary</p>

              <p>
                <span className="label">{t("columns.labels.regNumber")} </span>
                631,974
              </p>

              <p>
                <span className="label">{t("columns.labels.address")} </span>
                <br />
                Calle Ciudad Aljarafe Nº 24, Blq 24
                <br />
                Planta 2, Puerta 8<br />
                41927 Mairena del Aljarafe (Sevilla)
                <br />
                España
              </p>

              <p>
                <span className="label">{t("columns.labels.regDate")} </span>
                06/11/2025
              </p>
            </div>
          </div>
        </div>

        <div className="bottom-footer">
          <p>{t("bottom.rights", { year: currentYear })}</p>

          <div className="links">
            <a
              href={getTermsLink()} // Używamy helpera
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("bottom.terms")}
            </a>
            <span className="separator">|</span>
            <a
              href={getPrivacyLink()} // Używamy helpera
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("bottom.privacy")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
