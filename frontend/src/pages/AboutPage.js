import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import Banner from "../components/Banner";
import Button from "../components/ui/Button";

function AboutPage() {
  const { t } = useTranslation("about");

  return (
    <main className="page-about">
      <Banner
        image="/about-us-banner.jpg"
        title={t("banner.title")}
        text={t("banner.text")}
        ctaLabel={t("banner.cta")}
        ctaLink="/projects"
      />

      {/* PIERWSZA SEKCJA - KIM JESTEŚMY */}
      <section className="first-section">
        <div className="left-side">
          <h2 className="left-title">{t("intro.title")}</h2>
          <div className="about-text">
            <p>{t("intro.p1")}</p>
            <p>{t("intro.p2")}</p>
            <p>{t("intro.p3")}</p>
          </div>
        </div>
        <div
          className="right-side right-img"
          style={{ backgroundImage: "url('/elepepe-photo.jpg')" }}
          role="img"
          aria-label="Elepepe sanctuary photo"
        ></div>
      </section>

      {/* DRUGA SEKCJA - MISJA I HISTORIA */}
      <section className="second-section">
        <div className="content-wrapper">
          <div className="right-side">
            <div className="text-container">
              <h2 className="right-title">{t("mission.title")}</h2>
              <div className="right-text">
                <p>{t("mission.text")}</p>
              </div>
            </div>
            <div
              className="left-img"
              style={{ backgroundImage: "url(/1-sample.jpg)" }}
              role="img"
              aria-label="Rat rescue example"
            ></div>
          </div>

          <NavLink to="/success-stories" className="success-link">
            <Button variant="primary" size="lg" className="success-stories-btn">
              {t("mission.cta")}
            </Button>
          </NavLink>
        </div>
      </section>

      {/* TRZECIA SEKCJA - KAFELKI NAWIGACYJNE */}
      <section className="third-section">
        <div className="text-container">
          <h2 className="tile-title">{t("more.title")}</h2>
        </div>
        <div className="titles">
          <NavLink
            to="/partnerships"
            className="tile first"
            style={{ backgroundImage: "url(/3-sample.jpg)" }}
          >
            <span className="text">{t("more.partners")}</span>
          </NavLink>

          <NavLink
            to="/contact"
            className="tile second"
            style={{ backgroundImage: "url(/2-sample.jpg)" }}
          >
            <span className="text">{t("more.contact")}</span>
          </NavLink>

          {/* ZMIANA: Zwykły link <a> do zewnętrznej strony (Facebook) */}
          <a
            href="https://www.facebook.com/groups/2197499997397573" // Podmień na właściwy link
            target="_blank"
            rel="noopener noreferrer"
            className="tile third"
            style={{ backgroundImage: "url(/1-sample.jpg)" }}
          >
            {/* Jeśli chcesz zmienić tekst na np. "Nasza Społeczność", zaktualizuj plik about.json (klucz more.team) */}
            <span className="text">{t("more.team")}</span>
          </a>
        </div>
      </section>
    </main>
  );
}

export default AboutPage;
