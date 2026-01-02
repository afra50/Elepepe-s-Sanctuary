import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import SearchBar from "../ui/SearchBar";
import FilterBar from "../ui/FilterBar";
import ErrorState from "../ui/ErrorState";
import Select from "../ui/Select";

import ProjectCard from "../../components/admin/ProjectCard";
import api from "../../utils/api";

const initialFilters = {
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  species: "all",
  applicantType: "all",
  isUrgent: "all",
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

  // --- POBIERANIE DANYCH ---
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

    // 1. Zakładki
    if (activeTab !== "all") {
      result = result.filter((p) => p.status === activeTab);
    }

    // 2. Filtry
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

    if (filters.species !== "all") {
      result = result.filter((p) => p.species === filters.species);
    }

    if (filters.applicantType !== "all") {
      result = result.filter((p) => p.applicantType === filters.applicantType);
    }

    if (filters.isUrgent !== "all") {
      const shouldBeUrgent = filters.isUrgent === "true";
      result = result.filter((p) => Boolean(p.isUrgent) === shouldBeUrgent);
    }

    // 3. Sortowanie
    result.sort((a, b) => {
      const field = filters.sortBy;
      let valA, valB;

      if (field === "progress") {
        valA = a.amountTarget > 0 ? a.amountCollected / a.amountTarget : 0;
        valB = b.amountTarget > 0 ? b.amountCollected / b.amountTarget : 0;
      } else if (field === "amountTarget" || field === "amountCollected") {
        valA = Number(a[field]);
        valB = Number(b[field]);
      } else if (field === "deadline" || field === "createdAt") {
        valA = new Date(a[field]).getTime();
        valB = new Date(b[field]).getTime();
      } else {
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

  // --- OPCJE SELECTÓW (Definicje) ---
  const sortOptions = [
    { value: "createdAt", label: t("filters.sortOptions.date") },
    { value: "deadline", label: t("filters.sortOptions.deadline") },
    { value: "amountTarget", label: t("projects.fields.amountTarget") },
    { value: "amountCollected", label: t("projects.fields.amountCollected") },
    { value: "progress", label: t("filters.sortOptions.progress") },
  ];

  const speciesOptions = [
    { value: "all", label: t("filters.allSpecies") },
    { value: "rat", label: t("form.fields.species.options.rat") },
    { value: "guineaPig", label: t("form.fields.species.options.guineaPig") },
    { value: "other", label: t("form.fields.species.options.other") },
  ];

  const applicantTypeOptions = [
    { value: "all", label: t("filters.allTypes") },
    { value: "person", label: t("form.fields.applicantType.options.person") },
    {
      value: "organization",
      label: t("form.fields.applicantType.options.organization"),
    },
    {
      value: "vetClinic",
      label: t("form.fields.applicantType.options.vetClinic"),
    },
  ];

  const urgencyOptions = [
    {
      value: "all",
      label: t("filters.allPriorities") || "Wszystkie priorytety",
    },
    { value: "true", label: t("filters.importantPriority") || "Pilne" },
    { value: "false", label: t("filters.normalPriority") || "Zwykłe" },
  ];

  // Handler kliknięcia
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
          {/* --- ZAMIANA NATYWNYCH SELECTÓW NA NOWY KOMPONENT --- */}

          {/* Gatunek */}
          <div style={{ minWidth: "180px" }}>
            <Select
              value={filters.species}
              onChange={(val) => handleFilterChange("species", val)}
              options={speciesOptions}
              placeholder={t("filters.allSpecies")}
            />
          </div>

          {/* Typ wnioskodawcy */}
          <div style={{ minWidth: "180px" }}>
            <Select
              value={filters.applicantType}
              onChange={(val) => handleFilterChange("applicantType", val)}
              options={applicantTypeOptions}
              placeholder={t("filters.allTypes")}
            />
          </div>

          {/* Priorytet */}
          <div style={{ minWidth: "180px" }}>
            <Select
              value={filters.isUrgent}
              onChange={(val) => handleFilterChange("isUrgent", val)}
              options={urgencyOptions}
              placeholder={t("filters.allPriorities")}
            />
          </div>
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
