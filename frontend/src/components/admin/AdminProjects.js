import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import SearchBar from "../ui/SearchBar";
import FilterBar from "../ui/FilterBar";
import ErrorState from "../ui/ErrorState";

import ProjectCard from "../../components/admin/ProjectCard";
import api from "../../utils/api";

const initialFilters = {
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  species: "all",
  applicantType: "all",
  isUrgent: "all", // Filtr Pilne
};

const AdminProjects = () => {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();

  // STANY DANYCH
  const [activeTab, setActiveTab] = useState("active");
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // STANY FILTRÓW
  const [filters, setFilters] = useState(initialFilters);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // --- POBIERANIE DANYCH Z API ---
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/projects/admin");
      setProjects(response.data);
    } catch (err) {
      console.error("Błąd pobierania projektów:", err);
      setError(
        t("requests.fetchError") || "Nie udało się pobrać listy projektów."
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // --- FILTROWANIE ---
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const processedProjects = useMemo(() => {
    let result = [...projects];

    // 1. Zakładki (Status)
    if (activeTab !== "all") {
      result = result.filter((p) => p.status === activeTab);
    }

    // 2. Filtry
    // A. Szukajka
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) => {
        let titleObj = {};
        try {
          titleObj =
            typeof p.title === "string" ? JSON.parse(p.title) : p.title;
        } catch (e) {}

        const titlePL = titleObj?.pl?.toLowerCase() || "";
        return titlePL.includes(q) || p.animalName.toLowerCase().includes(q);
      });
    }

    // B. Gatunek
    if (filters.species !== "all") {
      result = result.filter((p) => p.species === filters.species);
    }

    // C. Typ wnioskodawcy
    if (filters.applicantType !== "all") {
      result = result.filter((p) => p.applicantType === filters.applicantType);
    }

    // D. Pilne
    if (filters.isUrgent !== "all") {
      const shouldBeUrgent = filters.isUrgent === "true";
      result = result.filter((p) => Boolean(p.isUrgent) === shouldBeUrgent);
    }

    // 3. Sortowanie - ZMODYFIKOWANE
    result.sort((a, b) => {
      const field = filters.sortBy;
      let valA, valB;

      // --- NOWOŚĆ: Sortowanie po Progresie ---
      if (field === "progress") {
        // Obliczamy % (zabezpieczenie przed dzieleniem przez 0)
        // Jeśli cel to 0, traktujemy progres jako 0
        valA = a.amountTarget > 0 ? a.amountCollected / a.amountTarget : 0;
        valB = b.amountTarget > 0 ? b.amountCollected / b.amountTarget : 0;
      }
      // Sortowanie po Kwotach
      else if (field === "amountTarget" || field === "amountCollected") {
        valA = Number(a[field]);
        valB = Number(b[field]);
      }
      // Sortowanie po Datach
      else if (field === "deadline" || field === "createdAt") {
        valA = new Date(a[field]).getTime();
        valB = new Date(b[field]).getTime();
      }
      // Fallback (np. stringi)
      else {
        valA = a[field];
        valB = b[field];
      }

      return filters.sortOrder === "asc"
        ? valA > valB
          ? 1
          : -1
        : valA < valB
        ? 1
        : -1;
    });

    return result;
  }, [projects, activeTab, filters]);

  const sortOptions = [
    {
      value: "createdAt",
      label: t("filters.sortOptions.date"),
    },
    {
      value: "deadline",
      label: t("filters.sortOptions.deadline"),
    },
    {
      value: "amountTarget",
      label: t("projects.fields.amountTarget"),
    },
    {
      value: "amountCollected",
      label: t("projects.fields.amountCollected"),
    },
    {
      value: "progress",
      label: t("filters.sortOptions.progress"),
    },
  ];

  // Handler kliknięcia w kartę -> Przekierowanie do edycji/szczegółów
  const handleProjectClick = (projectId) => {
    navigate(`/admin/projects/${projectId}`);
  };

  return (
    <div className="admin-projects-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t("menu.projects")}</h1>
          <p className="page-subtitle">{t("dashboard.projectsDesc")}</p>
        </div>
        <div className="actions-bar">
          <div className="header-search" style={{ minWidth: "300px" }}>
            <SearchBar
              value={filters.search}
              onChange={(val) => handleFilterChange("search", val)}
              onClear={() => handleFilterChange("search", "")}
              placeholder={t("filters.searchPlaceholder")}
            />
          </div>
          <div className="filter-toggle-btn">
            <Button
              variant={isFilterPanelOpen ? "primary" : "outline"}
              size="sm"
              icon={<Filter size={16} />}
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            >
              {t("actions.filter")}
            </Button>
          </div>
        </div>
      </header>

      {/* PANEL FILTRÓW */}
      <div
        className={`filter-panel-wrapper ${isFilterPanelOpen ? "open" : ""}`}
      >
        <FilterBar
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          sortOptions={sortOptions}
          onSortChange={(val) => handleFilterChange("sortBy", val)}
          onOrderToggle={() =>
            handleFilterChange(
              "sortOrder",
              filters.sortOrder === "asc" ? "desc" : "asc"
            )
          }
          onClear={() => setFilters(initialFilters)}
          clearLabel={t("filters.clear")}
        >
          <select
            value={filters.species}
            onChange={(e) => handleFilterChange("species", e.target.value)}
          >
            <option value="all">{t("filters.allSpecies")}</option>
            <option value="rat">{t("form.fields.species.options.rat")}</option>
            <option value="guineaPig">
              {t("form.fields.species.options.guineaPig")}
            </option>
            <option value="other">
              {t("form.fields.species.options.other")}
            </option>
          </select>

          <select
            value={filters.applicantType}
            onChange={(e) =>
              handleFilterChange("applicantType", e.target.value)
            }
          >
            <option value="all">{t("filters.allTypes")}</option>
            <option value="person">
              {t("form.fields.applicantType.options.person")}
            </option>
            <option value="organization">
              {t("form.fields.applicantType.options.organization")}
            </option>
            <option value="vetClinic">
              {t("form.fields.applicantType.options.vetClinic")}
            </option>
          </select>

          <select
            value={filters.isUrgent}
            onChange={(e) => handleFilterChange("isUrgent", e.target.value)}
          >
            <option value="all">
              {t("filters.allPriorities") || "Wszystkie priorytety"}
            </option>
            <option value="true">
              {t("filters.importantPriority") || "Pilne"}
            </option>
            <option value="false">
              {t("filters.normalPriority") || "Zwykłe"}
            </option>
          </select>
        </FilterBar>
      </div>

      {/* ZAKŁADKI STATUSÓW */}
      <div className="tabs-container">
        {["active", "draft", "completed", "cancelled"].map((status) => (
          <button
            key={status}
            className={`tab-btn ${activeTab === status ? "active" : ""}`}
            onClick={() => setActiveTab(status)}
          >
            {t(`projects.fields.statusOptions.${status}`) || status}
            <span className="count-badge">
              {projects.filter((p) => p.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* LISTA KART */}
      <div className="projects-content">
        {isLoading ? (
          <Loader size="lg" variant="center" />
        ) : error ? (
          <ErrorState
            title={t("requests.fetchError") || "Błąd"}
            message={error}
            onRetry={fetchProjects}
          />
        ) : processedProjects.length === 0 ? (
          <div className="empty-state">
            <h3>{t("requests.noRequestsFound")}</h3>
            <p>Brak projektów spełniających kryteria.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {processedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProjects;
