// src/pages/ActiveProjectsPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api from "../utils/api";
import FundraiserCard from "../components/FundraiserCard";
import Loader from "../components/ui/Loader";
import ErrorState from "../components/ui/ErrorState";
import FilterBar from "../components/ui/FilterBar";
import SearchBar from "../components/ui/SearchBar";
import Pagination from "../components/ui/Pagination";

/* ===== Helpery ===== */
const getDaysLeft = (endDate) => {
  if (!endDate) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
};

const getCompletionPercent = (current, goal) => {
  if (!goal || goal <= 0) return 0;
  return Math.round((current / goal) * 100);
};

const ITEMS_PER_PAGE = 10;

function ActiveProjectsPage() {
  const { t, i18n } = useTranslation("projects");
  const navigate = useNavigate();

  // ===== DATA STATE =====
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ===== UI STATE =====
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // ===== FETCH =====
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
      .finally(() => setLoading(false));
  }, [i18n.language]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ===== RESET PAGINATION przy search/sort =====
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

  // ===== SEARCH + SORT =====
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // SEARCH
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }

    // SORT
    result.sort((a, b) => {
      // DOMYŚLNE: pilne → dni do końca
      if (sortBy === "default") {
        if (a.isUrgent !== b.isUrgent) {
          return b.isUrgent - a.isUrgent;
        }
        return getDaysLeft(a.endDate) - getDaysLeft(b.endDate);
      }

      let valA, valB;

      switch (sortBy) {
        case "deadline":
          valA = getDaysLeft(a.endDate);
          valB = getDaysLeft(b.endDate);
          break;

        case "completion":
          valA = getCompletionPercent(a.current, a.goal);
          valB = getCompletionPercent(b.current, b.goal);
          break;

        case "date":
        default:
          valA = new Date(a.endDate);
          valB = new Date(b.endDate);
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return result;
  }, [projects, search, sortBy, sortOrder]);

  // ===== PAGINATION =====
  const totalPages = Math.ceil(
    filteredAndSortedProjects.length / ITEMS_PER_PAGE
  );

  const paginatedProjects = filteredAndSortedProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="active-projects-page">
      <header className="active-projects-header">
        <h1>{t("activeTitle")}</h1>
        <p>{t("activeSubtitle")}</p>
      </header>

      {/* ===== FILTER BAR ===== */}
      {!loading && !error && projects.length > 0 && (
        <FilterBar
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={setSortBy}
          onOrderToggle={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          onClear={() => {
            setSearch("");
            setSortBy("default");
            setSortOrder("asc");
          }}
          clearLabel={t("clear", "Wyczyść")}
          sortOptions={[
            { value: "default", label: t("sort.default", "Domyślne") },
            { value: "date", label: t("sort.date", "Najnowsze / najstarsze") },
            { value: "deadline", label: t("sort.deadline", "Dni do końca") },
            {
              value: "completion",
              label: t("sort.completion", "% ukończenia"),
            },
          ]}
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            placeholder={t("search", "Szukaj zbiórki...")}
          />
        </FilterBar>
      )}

      {/* ===== LOADING ===== */}
      {loading && <Loader variant="center" size="md" />}

      {/* ===== ERROR ===== */}
      {!loading && error && (
        <ErrorState
          title={t("error.title")}
          message={t("error.message")}
          onRetry={fetchProjects}
        />
      )}

      {/* ===== EMPTY: brak wyników wyszukiwania ===== */}
      {!loading &&
        !error &&
        projects.length > 0 &&
        filteredAndSortedProjects.length === 0 && (
          <div className="active-projects-empty">
            <h3>{t("emptySearch.title")}</h3>
            <p>{t("emptySearch.message")}</p>
          </div>
        )}

      {/* ===== EMPTY: brak aktywnych zbiórek ===== */}
      {!loading && !error && projects.length === 0 && (
        <div className="active-projects-empty">
          <h3>{t("empty.title")}</h3>
          <p>{t("empty.message")}</p>
        </div>
      )}

      {/* ===== GRID + PAGINATION ===== */}
      {!loading && !error && paginatedProjects.length > 0 && (
        <>
          <section className="active-projects-grid">
            {paginatedProjects.map((project) => (
              <div
                key={project.id}
                className={`active-project-wrapper ${
                  project.isUrgent ? "is-urgent" : ""
                }`}
              >
                {project.isUrgent && (
                  <span className="urgent-badge">{t("urgent.label")}</span>
                )}

                <FundraiserCard
                  project={project}
                  onCardClick={() => navigate(`/projects/${project.slug}`)}
                  onDonateClick={() => navigate(`/projects/${project.slug}`)}
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

export default ActiveProjectsPage;
