import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Filter } from "lucide-react";

// Importy UI
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import SearchBar from "../ui/SearchBar";
import FilterBar from "../ui/FilterBar";
import ErrorState from "../ui/ErrorState";
import Alert from "../../components/ui/Alert";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Select from "../ui/Select"; // <--- 1. Import nowego Selecta

// Importy logiki/danych
import RequestCard from "../../components/admin/RequestCard";
import CreateProjectModal from "../../components/admin/CreateProjectModal";
import RequestDetailsModal from "../../components/admin/RequestDetailsModal";
import api from "../../utils/api";

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
  const { t } = useTranslation("admin");
  const navigate = useNavigate();

  // --- STANY DANYCH ---
  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- STANY SZCZEGÓŁÓW ---
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // --- STANY FILTRÓW ---
  const [filters, setFilters] = useState(initialFilters);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // --- STANY UI: ALERT I CONFIRM ---
  const [alert, setAlert] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    variant: "info",
    targetStatus: null,
  });

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  // --- 1. POBIERANIE LISTY ---
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/requests");
      setRequests(response.data);
    } catch (err) {
      setError(t("requests.fetchError") || "Error fetching requests");
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // --- 2. OBSŁUGA SZCZEGÓŁÓW ---
  const handleOpenDetails = async (req) => {
    setSelectedRequest(req);
    setIsDetailsLoading(true);
    setDetailsError(null);
    setRequestDetails(null);

    try {
      const response = await api.get(`/requests/${req.id}`);
      setRequestDetails(response.data);
    } catch (err) {
      console.error("Błąd pobierania szczegółów:", err);
      setDetailsError(
        t("requests.fetchError") || "Nie udało się pobrać szczegółów."
      );
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
    setRequestDetails(null);
  };

  // --- 3. LOGIKA ZMIANY STATUSU ---
  const requestStatusChange = (newStatus) => {
    if (!selectedRequest) return;

    let message = "";
    let variant = "info";

    switch (newStatus) {
      case "approved":
        message =
          t("status.confirmApprove") ||
          `Czy na pewno chcesz ZATWIERDZIĆ wniosek #${selectedRequest.id}?`;
        variant = "success";
        break;
      case "rejected":
        message =
          t("status.confirmReject") ||
          `Czy na pewno chcesz ODRZUCIĆ wniosek #${selectedRequest.id}?`;
        variant = "danger";
        break;
      case "pending":
        message =
          t("status.confirmPending") ||
          `Czy przywrócić wniosek #${selectedRequest.id} do oczekujących?`;
        variant = "info";
        break;
      default:
        message = `Zmienić status na ${newStatus}?`;
    }

    setConfirmDialog({
      isOpen: true,
      message,
      variant,
      targetStatus: newStatus,
    });
  };

  const executeStatusChange = async () => {
    const { targetStatus } = confirmDialog;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

    if (!selectedRequest || !targetStatus) return;

    try {
      await api.patch(`/requests/${selectedRequest.id}/status`, {
        status: targetStatus,
      });

      setAlert({
        variant: "success",
        message:
          t("status.successMessage") || "Status został zmieniony pomyślnie!",
      });

      handleCloseDetails();
      fetchRequests();
    } catch (err) {
      console.error("Błąd zmiany statusu:", err);
      setAlert({
        variant: "error",
        message:
          t("status.errorMessage") || "Wystąpił błąd podczas zmiany statusu.",
      });
    }
  };

  const cancelStatusChange = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleApprove = () => {
    setIsCreateProjectOpen(true);
  };

  const handleProjectCreatedSuccess = () => {
    setAlert({
      variant: "success",
      message:
        t("status.projectCreatedSuccess") || "Zbiórka została utworzona!",
    });
    fetchRequests();
    handleCloseDetails();
  };

  const handleReject = () => requestStatusChange("rejected");
  const handlePending = () => requestStatusChange("pending");

  // --- 4. FILTRY I SORTOWANIE ---
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const processedRequests = useMemo(() => {
    let result = [...requests].filter((req) => req.status === activeTab);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((req) => req.fullName.toLowerCase().includes(q));
    }
    if (filters.species !== "all")
      result = result.filter((req) => req.species === filters.species);
    if (filters.applicantType !== "all")
      result = result.filter(
        (req) => req.applicantType === filters.applicantType
      );
    if (filters.language !== "all")
      result = result.filter(
        (req) => req.submissionLanguage === filters.language
      );

    result.sort((a, b) => {
      const field = filters.sortBy;
      let valA = a[field],
        valB = b[field];
      if (field === "createdAt" || field === "deadline") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (field === "amount") {
        valA = Number(valA);
        valB = Number(valB);
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
  }, [requests, activeTab, filters]);

  // --- OPCJE SELECTÓW (Definicje) ---
  const sortOptions = [
    { value: "createdAt", label: t("filters.sortOptions.date") },
    { value: "deadline", label: t("filters.sortOptions.deadline") },
    { value: "amount", label: t("filters.sortOptions.amount") },
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

  const languageOptions = [
    { value: "all", label: t("filters.allLanguages") },
    { value: "pl", label: "🇵🇱 Polski" },
    { value: "en", label: "🇬🇧 English" },
    { value: "es", label: "🇪🇸 Español" },
  ];

  const handleViewProject = (requestDetails) => {
    const projectId = requestDetails.projectId || requestDetails.id;
    if (projectId) {
      navigate(`/admin/projects/${projectId}`);
    } else {
      console.error("Brak ID projektu do przekierowania");
    }
  };

  return (
    <div className="admin-requests-page">
      {/* 1. ALERT (TOAST) - Zachowany */}
      {alert &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              zIndex: 99999,
            }}
          >
            <Alert
              variant={alert.variant}
              autoClose={5000}
              onClose={() => setAlert(null)}
            >
              {alert.message}
            </Alert>
          </div>,
          document.body
        )}

      {/* 2. CONFIRM DIALOG - Zachowany */}
      {confirmDialog.isOpen &&
        createPortal(
          <div style={{ position: "relative", zIndex: 100000 }}>
            <ConfirmDialog
              isOpen={confirmDialog.isOpen}
              message={confirmDialog.message}
              variant={confirmDialog.variant}
              confirmLabel={t("actions.yes") || "Tak"}
              cancelLabel={t("actions.cancel") || "Anuluj"}
              onConfirm={executeStatusChange}
              onCancel={cancelStatusChange}
            />
          </div>,
          document.body
        )}

      {/* --- GŁÓWNA ZAWARTOŚĆ --- */}
      <header className="page-header">
        <div>
          <h1 className="page-title">{t("menu.requests")}</h1>
          <p className="page-subtitle">{t("requests.subtitle")}</p>
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
          {/* --- ZAMIANA STARYCH SELECTÓW NA NOWE KOMPONENTY SELECT --- */}

          {/* Filtr Gatunku */}
          <div style={{ minWidth: "180px" }}>
            <Select
              value={filters.species}
              onChange={(val) => handleFilterChange("species", val)}
              options={speciesOptions}
              placeholder={t("filters.allSpecies")}
            />
          </div>

          {/* Filtr Typu Wnioskodawcy */}
          <div style={{ minWidth: "180px" }}>
            <Select
              value={filters.applicantType}
              onChange={(val) => handleFilterChange("applicantType", val)}
              options={applicantTypeOptions}
              placeholder={t("filters.allTypes")}
            />
          </div>

          {/* Filtr Języka */}
          <div style={{ minWidth: "180px" }}>
            <Select
              value={filters.language}
              onChange={(val) => handleFilterChange("language", val)}
              options={languageOptions}
              placeholder={t("filters.allLanguages")}
            />
          </div>
        </FilterBar>
      </div>

      <div className="tabs-container">
        {["pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            className={`tab-btn ${activeTab === status ? "active" : ""}`}
            onClick={() => setActiveTab(status)}
          >
            {t(`status.${status}`)}
            <span className="count-badge">
              {requests.filter((r) => r.status === status).length}
            </span>
          </button>
        ))}
      </div>

      <div className="requests-content">
        {isLoading ? (
          <Loader size="lg" variant="center" />
        ) : error ? (
          <ErrorState
            title={t("requests.fetchError") || "Wystąpił błąd"}
            message={error}
            onRetry={fetchRequests}
          />
        ) : processedRequests.length === 0 ? (
          <div className="empty-state">
            <h3>{t("requests.noRequestsFound")}</h3>
            <p>{t("requests.allDone")}</p>
          </div>
        ) : (
          <div className="requests-grid">
            {processedRequests.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onClick={() => handleOpenDetails(req)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        request={requestDetails || selectedRequest}
        onSuccess={handleProjectCreatedSuccess}
      />

      <RequestDetailsModal
        isOpen={!!selectedRequest}
        onClose={handleCloseDetails}
        requestRaw={selectedRequest}
        details={requestDetails}
        isLoading={isDetailsLoading}
        error={detailsError}
        onRetry={() => handleOpenDetails(selectedRequest)}
        onApprove={handleApprove}
        onReject={handleReject}
        onPending={handlePending}
        onViewProject={handleViewProject}
      />
    </div>
  );
};

export default AdminRequests;
