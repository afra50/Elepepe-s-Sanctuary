import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Filter, Search, ArrowUpDown } from "lucide-react";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import RequestCard from "../../components/admin/RequestCard";
import api from "../../utils/api";
import SearchBar from "../ui/SearchBar";
import FilterBar from "../ui/FilterBar";

// Stan początkowy filtrów
const initialFilters = {
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  species: "all",
  applicantType: "all",
  language: "all",
};

const AdminRequests = () => {
  const { t, i18n } = useTranslation("admin");

  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Stan filtrów
  const [filters, setFilters] = useState(initialFilters);

  // Stan widoczności panelu filtrów (TYLKO DLA MOBILE)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // --- 1. POBIERANIE DANYCH ---
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get("/requests");
        // Zapisujemy surowe dane, formatowanie daty następuje w RequestCard
        setRequests(response.data);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError(t("requests.fetchError") || "Nie udało się pobrać zgłoszeń.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [t]);

  // --- Handlery ---
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  // --- Logika Filtrowania i Sortowania ---
  const processedRequests = useMemo(() => {
    let result = [...requests];

    // 1. Zakładka
    result = result.filter((req) => req.status === activeTab);

    // 2. Wyszukiwarka
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((req) => req.fullName.toLowerCase().includes(q));
    }

    // 3. Filtry Dropdown
    if (filters.species !== "all") {
      result = result.filter((req) => req.species === filters.species);
    }
    if (filters.applicantType !== "all") {
      result = result.filter(
        (req) => req.applicantType === filters.applicantType
      );
    }
    if (filters.language !== "all") {
      result = result.filter(
        (req) => req.submissionLanguage === filters.language
      );
    }

    // 4. Sortowanie
    result.sort((a, b) => {
      const field = filters.sortBy;
      let valA = a[field];
      let valB = b[field];

      if (field === "createdAt" || field === "deadline") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (field === "amount") {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (valA < valB) return filters.sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [requests, activeTab, filters]);

  // Opcje do sortowania
  const sortOptions = [
    {
      value: "createdAt",
      label: t("filters.sortOptions.date") || "Data dodania",
    },
    { value: "deadline", label: t("filters.sortOptions.deadline") || "Termin" },
    { value: "amount", label: t("filters.sortOptions.amount") || "Kwota" },
  ];

  return (
    <div className="admin-requests-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t("menu.requests")}</h1>
          <p className="page-subtitle">
            {t("requests.subtitle") ||
              "Zarządzaj nadesłanymi prośbami o wsparcie"}
          </p>
        </div>

        <div className="actions-bar">
          {/* Wyszukiwarka w headerze (ukrywana na mobile przez CSS) */}
          <div className="header-search" style={{ minWidth: "300px" }}>
            <SearchBar
              value={filters.search}
              onChange={(val) => handleFilterChange("search", val)}
              onClear={() => handleFilterChange("search", "")}
              placeholder={t("filters.searchPlaceholder")}
            />
          </div>

          {/* Przycisk Filtry - widoczny TYLKO na mobile (przez CSS) */}
          <div className="filter-toggle-btn">
            <Button
              variant={isFilterPanelOpen ? "primary" : "outline"}
              size="sm"
              icon={<Filter size={16} />}
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            >
              {t("actions.filter") || "Filtry"}
            </Button>
          </div>
        </div>
      </header>

      {/* --- PANEL FILTRÓW --- */}
      {/* Klasa 'open' jest dodawana tylko gdy klikniemy przycisk na mobile. 
          Na desktopie CSS wymusi display: block niezależnie od stanu. */}
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
          onClear={handleClearFilters}
          clearLabel={t("filters.clear")}
        >
          {/* Na mobile SearchBar znika z headera, więc warto dodać go tutaj, 
              ale FilterBar przyjmuje children. Możemy to zostawić jak jest, 
              ewentualnie dodać drugi SearchBar widoczny tylko na mobile wewnątrz FilterBar */}

          <select
            value={filters.species}
            onChange={(e) => handleFilterChange("species", e.target.value)}
          >
            <option value="all">
              {t("filters.allSpecies") || "Wszystkie gatunki"}
            </option>
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
            <option value="all">
              {t("filters.allTypes") || "Wszyscy zgłaszający"}
            </option>
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
            value={filters.language}
            onChange={(e) => handleFilterChange("language", e.target.value)}
          >
            <option value="all">
              {t("filters.allLanguages") || "Wszystkie języki"}
            </option>
            <option value="pl">🇵🇱 Polski</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
          </select>
        </FilterBar>
      </div>

      {/* --- ZAKŁADKI --- */}
      <div className="tabs-container">
        {["pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            className={`tab-btn ${activeTab === status ? "active" : ""}`}
            onClick={() => setActiveTab(status)}
          >
            {t(`status.${status}`) || status}
            <span className="count-badge">
              {requests.filter((r) => r.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* --- LISTA KART --- */}
      <div className="requests-content">
        {isLoading ? (
          <div className="loading-state">
            <Loader size="lg" variant="center" />
          </div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : processedRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Search size={48} />
            </div>
            <h3>
              {t("requests.noRequestsFound") || "Brak zgłoszeń w tej sekcji"}
            </h3>
            <p>
              {t("requests.allDone") ||
                "Wszystkie zgłoszenia zostały już obsłużone."}
            </p>
          </div>
        ) : (
          <div className="requests-grid">
            {processedRequests.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onClick={() => setSelectedRequest(req)}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL --- */}
      {selectedRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2>Szczegóły: {selectedRequest.fullName}</h2>
            <pre
              style={{
                maxHeight: "400px",
                overflow: "auto",
                background: "#f5f5f5",
                padding: "1rem",
              }}
            >
              {JSON.stringify(selectedRequest, null, 2)}
            </pre>
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button onClick={() => setSelectedRequest(null)}>Zamknij</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
