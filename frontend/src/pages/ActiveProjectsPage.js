// src/pages/projects/ActiveProjectsPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FundraiserCard from "../components/FundraiserCard";

const MOCK_PROJECTS = [
  {
    id: 1,
    slug: "pilna-operacja-moli",
    title: "Pilna operacja Moli",
    image: "/mock/projects/mola.jpg",
    current: 3100,
    goal: 4200,
    endDate: "2025-10-05",
    isUrgent: true,
  },
  {
    id: 2,
    slug: "leczenie-kawii-lili",
    title: "Leczenie kawii Lili",
    image: "/mock/projects/lili.jpg",
    current: 640,
    goal: 1800,
    endDate: "2026-02-01",
    isUrgent: false,
  },
  {
    id: 3,
    slug: "ratowanie-stada",
    title: "Ratowanie stada po interwencji",
    image: "/mock/projects/stado.jpg",
    current: 1200,
    goal: 9200,
    endDate: "2025-09-28",
    isUrgent: true,
  },
];

function ActiveProjectsPage() {
  const { t } = useTranslation("projects");
  const navigate = useNavigate();

  return (
    <div className="active-projects-page">
      <header className="active-projects-header">
        <h1>{t("activeTitle", "Aktywne zbiórki")}</h1>
        <p>
          {t(
            "activeSubtitle",
            "Za każdą z tych zbiórek stoi konkretna historia i realna potrzeba leczenia małego podopiecznego."
          )}
        </p>
      </header>

      <section className="active-projects-grid">
        {MOCK_PROJECTS.map((project) => (
          <div
            key={project.id}
            className={`active-project-wrapper ${
              project.isUrgent ? "is-urgent" : ""
            }`}
          >
            <FundraiserCard
              project={project}
              onCardClick={() => navigate(`/projects/${project.slug}`)}
              onDonateClick={() => navigate(`/projects/${project.slug}`)}
            />
          </div>
        ))}
      </section>
    </div>
  );
}

export default ActiveProjectsPage;
