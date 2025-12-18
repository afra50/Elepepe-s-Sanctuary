// src/pages/projects/ActiveProjectsPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api from "../utils/api";
import FundraiserCard from "../components/FundraiserCard";
import Loader from "../components/ui/Loader";
import ErrorState from "../components/ui/ErrorState";

function ActiveProjectsPage() {
  const { t, i18n } = useTranslation("projects");
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProjects = useCallback(() => {
    setLoading(true);
    setError(false);

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
        console.error("Failed to load projects", err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [i18n.language]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

      {/* ===== LOADING ===== */}
      {loading && <Loader variant="center" size="md" />}

      {/* ===== ERROR ===== */}
      {!loading && error && (
        <ErrorState
          title={t("error.title", "Nie udało się pobrać zbiórek")}
          message={t(
            "error.message",
            "Wystąpił problem z połączeniem z serwerem. Spróbuj ponownie."
          )}
          onRetry={fetchProjects}
        />
      )}

      {/* ===== EMPTY STATE ===== */}
      {!loading && !error && projects.length === 0 && (
        <div className="active-projects-empty">
          <h3>{t("empty.title", "Brak aktywnych zbiórek")}</h3>
          <p>
            {t(
              "empty.message",
              "Obecnie nie prowadzimy żadnych aktywnych zbiórek. Zajrzyj ponownie później lub zgłoś potrzebę pomocy."
            )}
          </p>
        </div>
      )}

      {/* ===== DATA ===== */}
      {!loading && !error && projects.length > 0 && (
        <section className="active-projects-grid">
          {projects.map((project) => (
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
      )}
    </div>
  );
}

export default ActiveProjectsPage;
