import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Banner from "../components/Banner";
import FundraiserCard from "../components/FundraiserCard";
import Slider from "react-slick";
import api from "../utils/api";
import Loader from "../components/ui/Loader";
import ErrorState from "../components/ui/ErrorState";

const getDaysLeft = (endDate) => {
  if (!endDate) return Infinity;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
};

function SliderArrow({ className, onClick, direction }) {
  return (
    <button
      type="button"
      className={`slider-arrow ${direction}`}
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous" : "Next"}
    />
  );
}

function HomePage() {
  const { t, i18n } = useTranslation("home");

  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loadingUrgent, setLoadingUrgent] = useState(true);
  const [urgentError, setUrgentError] = useState(false);

  useEffect(() => {
    setLoadingUrgent(true);
    setUrgentError(false);

    api
      .get("/projects")
      .then((res) => {
        const lang = i18n.language || "pl";

        const mapped = res.data.map((p) => ({
          id: p.id,
          slug: p.slug,
          isUrgent: p.isUrgent,
          title: p.title?.[lang] || p.title?.pl || "",
          image: p.image,
          current: p.amountCollected,
          goal: p.amountTarget,
          endDate: p.deadline,
        }));

        setProjects(mapped);
      })
      .catch((err) => {
        console.error("Failed to load projects for homepage", err);
        setUrgentError(true);
      })
      .finally(() => setLoadingUrgent(false));
  }, [i18n.language]);

  const urgentProjectsForSlider = useMemo(() => {
    if (!projects.length) return [];

    const urgent = projects.filter((p) => p.isUrgent);

    if (urgent.length >= 3) {
      return urgent.slice(0, 6); // max np. 6 do slidera
    }

    const nonUrgentSorted = projects
      .filter((p) => !p.isUrgent)
      .sort((a, b) => getDaysLeft(a.endDate) - getDaysLeft(b.endDate));

    return [...urgent, ...nonUrgentSorted].slice(0, 3);
  }, [projects]);

  const sliderSettings = {
    dots: false,
    arrows: true,
    infinite: true,
    speed: 450,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3800,
    pauseOnHover: true,
    prevArrow: <SliderArrow direction="prev" />,
    nextArrow: <SliderArrow direction="next" />,

    responsive: [
      // === duże tablety / mniejsze laptopy ===
      {
        breakpoint: 1400,
        settings: {
          slidesToShow: 3,
          arrows: false,
        },
      },

      // === tablet pionowo ===
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
          arrows: false,
        },
      },

      // === mobile ===
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 1,
          arrows: false,
          swipe: true,
        },
      },
    ],
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

          {loadingUrgent ? (
            <Loader variant="center" size="md" />
          ) : urgentError ? (
            <ErrorState
              title={t("urgent.errorTitle")}
              message={t("urgent.errorMessage")}
              onRetry={() => window.location.reload()}
            />
          ) : urgentProjectsForSlider.length === 0 ? (
            <p>{t("urgent.empty")}</p>
          ) : (
            <Slider {...sliderSettings}>
              {urgentProjectsForSlider.map((project) => (
                <div key={project.id} className="urgent-slide">
                  <FundraiserCard
                    project={project}
                    onCardClick={() => navigate(`/projects/${project.slug}`)}
                    onDonateClick={() => navigate(`/projects/${project.slug}`)}
                  />
                </div>
              ))}
            </Slider>
          )}
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
