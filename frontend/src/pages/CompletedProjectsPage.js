// src/pages/CompletedProjectsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api from "../utils/api";
import FundraiserCard from "../components/FundraiserCard";
import Loader from "../components/ui/Loader";
import ErrorState from "../components/ui/ErrorState";
import Pagination from "../components/ui/Pagination";
import SearchBar from "../components/ui/SearchBar";

import { HeartHandshake } from "lucide-react";

const ITEMS_PER_PAGE = 10;

function CompletedProjectsPage() {
  const { t, i18n } = useTranslation("projects");
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState("");
  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setLoading(true);
    api
      .get("/projects/completed")
      .then((res) => {
        const lang = i18n.language || "pl";
        const mapped = res.data.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title?.[lang] || p.title?.pl,
          image: p.image,
          current: p.amountCollected,
          goal: p.amountTarget,
          endDate: p.deadline,
          isCompleted: true,
        }));
        setProjects(mapped);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  const paginated = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="active-projects-page">
      <header className="active-projects-header">
        <h1>{t("completedTitle", "Zakończone zbiórki")}</h1>
        <p>
          {t(
            "completedSubtitle",
            "Poznaj historie zwierząt, którym wspólnie udało się pomóc."
          )}
        </p>
      </header>

      {!loading && !error && projects.length > 0 && (
        <div className="active-projects-filters active-projects-filters--completed">
          <SearchBar
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            placeholder={t("searchCompleted", "Szukaj zakończonej zbiórki...")}
          />
        </div>
      )}

      {loading && <Loader variant="center" />}
      {error && <ErrorState />}

      {!loading && !error && projects.length === 0 && (
        <div className="active-projects-empty">
          <HeartHandshake size={40} strokeWidth={1.5} />
          <h3>{t("completedEmpty.title")}</h3>
          <p>
            {t(
              "completedEmpty.message",
              "Nie ma jeszcze zakończonych zbiórek. Wróć później, aby poznać historie pomocy."
            )}
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        projects.length > 0 &&
        filteredProjects.length === 0 && (
          <div className="active-projects-empty">
            <HeartHandshake size={40} strokeWidth={1.5} />
            <h3>{t("completedEmptySearch.title")}</h3>
            <p>{t("completedEmptySearch.message")}</p>
          </div>
        )}

      {!loading && !error && paginated.length > 0 && (
        <>
          <section className="active-projects-grid">
            {paginated.map((project) => (
              <div className="completed-project-wrapper">
                <span className="completed-badge">
                  {t("completedBadge", "Zakończona")}
                </span>

                <FundraiserCard
                  project={project}
                  onCardClick={() => navigate(`/projects/${project.slug}`)}
                />
              </div>
            ))}
          </section>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}

export default CompletedProjectsPage;
