import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import ProgressBar from "../components/ui/ProgressBar";
import Banner from "../components/Banner"; // <--- 1. IMPORT BANERA

function HomePage() {
  const { t } = useTranslation("home");
  const navigate = useNavigate();

  const urgentProjects = [
    {
      id: 1,
      title: "Operacja guza dla Szczurka Benia",
      image: "/1-sample.jpg",
      current: 450,
      goal: 1200,
    },
    {
      id: 2,
      title: "Leczenie zapalenia płuc Lusi",
      image: "/2-sample.jpg",
      current: 890,
      goal: 1000,
    },
    {
      id: 3,
      title: "For Kebab's difficult operation",
      image: "/3-sample.jpg",
      current: 0,
      goal: 2300,
    },
  ];

  const handleDonateClick = (e, projectId) => {
    e.stopPropagation();
    navigate(`/donate/${projectId}`);
  };

  return (
    <main className="home-page">
      <section className="hero container">
        <div className="hero__content">
          <div className="hero__badge">{t("hero.badge")}</div>
          <h1 className="hero__title">{t("hero.title")}</h1>
          <p className="hero__subtitle">{t("hero.subtitle")}</p>

          <div className="hero__actions">
            <NavLink to="/projects">
              <Button variant="primary" size="lg" className="hero-btn">
                {t("hero.ctaDonate")}
              </Button>
            </NavLink>

            <NavLink to="/request-support">
              <Button variant="secondary" size="lg" className="hero-btn">
                {t("hero.ctaRequest")}
              </Button>
            </NavLink>
          </div>
        </div>
        <div className="hero__visual">
          <img src="/logo.jpg" alt="Elepepe" className="hero-img-placeholder" />
        </div>
      </section>

      <section className="urgent-projects">
        <div className="container">
          <h2 className="section-title">{t("urgent.title")}</h2>

          <div className="projects-grid">
            {urgentProjects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="project-card__img-wrapper">
                  <div
                    className="project-card__image"
                    style={{ backgroundImage: `url(${project.image})` }}
                  ></div>
                </div>

                <div className="project-card__content">
                  <h3>{project.title}</h3>

                  <div className="project-stats">
                    <div className="stat-row">
                      <span>
                        {t("urgent.raised")}{" "}
                        <strong>{project.current} PLN</strong>
                      </span>
                      <span>
                        {t("urgent.goal")} <strong>{project.goal} PLN</strong>
                      </span>
                    </div>
                    <ProgressBar
                      current={project.current}
                      goal={project.goal}
                    />
                  </div>

                  <Button
                    variant="primary"
                    className="full-width"
                    onClick={(e) => handleDonateClick(e, project.id)}
                  >
                    {t("urgent.support")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Banner
        image="/banner-home.jpg"
        title={t("banner.title")}
        text={t("banner.text")}
        ctaLabel={t("banner.cta")}
        ctaLink="/success-stories"
      />

      <section className="steps-section container">
        <h2 className="section-title center">{t("steps.title")}</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>{t("steps.step1.title")}</h3>
            <p>{t("steps.step1.desc")}</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>{t("steps.step2.title")}</h3>
            <p>{t("steps.step2.desc")}</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>{t("steps.step3.title")}</h3>
            <p>{t("steps.step3.desc")}</p>
          </div>
        </div>
      </section>

      {/* 2. STORY SECTION */}
      <section className="story-section">
        <div className="container story-container">
          <div className="story-image">
            <div
              className="img-frame"
              style={{ backgroundImage: "url('/elepepe-photo.jpg')" }}
            ></div>
          </div>
          <div className="story-content">
            <h2 className="section-title">{t("story.title")}</h2>
            <p className="story-text">{t("story.text")}</p>
            <blockquote className="story-mission">
              {t("story.mission")}
            </blockquote>
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
