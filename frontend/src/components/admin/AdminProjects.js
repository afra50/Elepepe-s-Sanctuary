import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Filter } from "lucide-react";

import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import SearchBar from "../ui/SearchBar";
import FilterBar from "../ui/FilterBar";
import ErrorState from "../ui/ErrorState";

import ProjectCard from "../../components/admin/ProjectCard";
import ProjectDetailsModal from "../../components/admin/ProjectDetailsModal";
// import api from "../../utils/api";

const initialFilters = {
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  species: "all",
  applicantType: "all", // Dodano filtr typu zgłaszającego
};

const AdminProjects = () => {
  const { t } = useTranslation("admin");

  // STANY
  const [activeTab, setActiveTab] = useState("active");
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const [filters, setFilters] = useState(initialFilters);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // MOCK DATA
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // const response = await api.get("/projects");
      // setProjects(response.data);

      await new Promise((resolve) => setTimeout(resolve, 600));
      const mockData = [
        {
          id: 1,
          status: "active",
          isUrgent: 1,
          slug: "pomoc-dla-reksia",
          animalName: "Reksio",
          animalsCount: 1,
          species: "rat",
          applicantType: "person", // Dodane pole
          city: "Warszawa",
          amountTarget: 1500.0,
          amountCollected: 450.0,
          currency: "PLN",
          deadline: "2024-05-20",
          createdAt: "2024-01-10",
          title: JSON.stringify({
            pl: "Pomoc dla Reksia",
            en: "Help for Reksio",
          }),
          description: JSON.stringify({ pl: "Opis...", en: "Description..." }),
          country: JSON.stringify({ pl: "Polska" }),
          age: JSON.stringify({ pl: "2 lata" }),
          files: [
            {
              id: 1,
              url: "https://placehold.co/600x400/orange/white?text=Reksio",
              isCover: 1,
            },
          ],
        },
        {
          id: 2,
          status: "draft",
          isUrgent: 0,
          slug: "swinka-peppa",
          animalName: "Peppa",
          animalsCount: 2,
          species: "guineaPig",
          applicantType: "organization", // Dodane pole
          city: "Kraków",
          amountTarget: 500.0,
          amountCollected: 0.0,
          currency: "EUR",
          deadline: "2024-06-01",
          createdAt: "2024-02-15",
          title: JSON.stringify({ pl: "Świnka Peppa" }),
          description: JSON.stringify({ pl: "Opis świnki..." }),
          country: JSON.stringify({ pl: "Polska" }),
          files: [],
        },
        {
          id: 3,
          status: "completed",
          isUrgent: 0,
          slug: "zbiorka-zakonczona",
          animalName: "Burek",
          animalsCount: 1,
          species: "other",
          applicantType: "vetClinic", // Dodane pole
          city: "Gdańsk",
          amountTarget: 1000.0,
          amountCollected: 1200.0,
          currency: "PLN",
          deadline: "2023-12-01",
          createdAt: "2023-11-01",
          title: JSON.stringify({ pl: "Udana zbiórka" }),
          description: JSON.stringify({ pl: "Dziękujemy!" }),
          country: JSON.stringify({ pl: "Polska" }),
          files: [],
        },
        {
          id: 4,
          status: "cancelled",
          isUrgent: 0,
          slug: "anulowana-zbiorka",
          animalName: "Mruczek",
          animalsCount: 1,
          species: "other",
          applicantType: "person", // Dodane pole
          city: "Wrocław",
          amountTarget: 2000.0,
          amountCollected: 50.0,
          currency: "PLN",
          deadline: "2024-01-01",
          createdAt: "2023-12-01",
          title: JSON.stringify({ pl: "Anulowana zbiórka" }),
          description: JSON.stringify({ pl: "Niestety..." }),
          country: JSON.stringify({ pl: "Polska" }),
          files: [],
        },
      ];
      setProjects(mockData);
    } catch (err) {
      setError("Błąd pobierania projektów");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const processedProjects = useMemo(() => {
    let result = [...projects];

    // Zakładki
    if (activeTab !== "all") {
      result = result.filter((p) => p.status === activeTab);
    }

    // Filtry
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) => {
        const titlePL = p.title ? JSON.parse(p.title).pl?.toLowerCase() : "";
        return titlePL?.includes(q) || p.animalName.toLowerCase().includes(q);
      });
    }
    if (filters.species !== "all") {
      result = result.filter((p) => p.species === filters.species);
    }
    if (filters.applicantType !== "all") {
      result = result.filter((p) => p.applicantType === filters.applicantType);
    }

    // Sortowanie
    result.sort((a, b) => {
      const field = filters.sortBy;
      let valA = a[field],
        valB = b[field];

      // Obsługa pól numerycznych
      if (field === "amountTarget" || field === "amountCollected") {
        valA = Number(valA);
        valB = Number(valB);
      }
      // Obsługa dat
      else if (field === "deadline" || field === "createdAt") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
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
    { value: "createdAt", label: t("filters.sortOptions.date") },
    {
      value: "deadline",
      label: t("filters.sortOptions.deadline") || "Deadline",
    },
    {
      value: "amountTarget",
      label: t("projects.fields.amountTarget") || "Cel zbiórki",
    },
    {
      value: "amountCollected",
      label: t("projects.fields.amountCollected") || "Uzbierana kwota",
    },
  ];

  const handleStatusChange = (project, newStatus) => {
    console.log("Status change:", project.id, newStatus);
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
        </FilterBar>
      </div>

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

      <div className="projects-content">
        {isLoading ? (
          <Loader size="lg" variant="center" />
        ) : error ? (
          <ErrorState title="Błąd" message={error} onRetry={fetchProjects} />
        ) : processedProjects.length === 0 ? (
          <div className="empty-state">
            <h3>{t("requests.noRequestsFound")}</h3>
            <p>Brak projektów.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {processedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectDetailsModal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default AdminProjects;
