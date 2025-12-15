import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom"; // <--- KLUCZOWY IMPORT DO NAPRAWY WIDOCZNOŚCI
import { useTranslation } from "react-i18next";
import {
  Filter,
  ExternalLink,
  Check,
  Minus,
  Download,
  X,
  RotateCcw,
} from "lucide-react";

// Importy UI
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import SearchBar from "../ui/SearchBar";
import FilterBar from "../ui/FilterBar";
import Modal from "../ui/Modal";
import ErrorState from "../ui/ErrorState";
import Alert from "../../components/ui/Alert";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

// Importy logiki/danych
import RequestCard from "../../components/admin/RequestCard";
import CreateProjectModal from "../../components/admin/CreateProjectModal";
import api from "../../utils/api";
import { formatDate } from "../../utils/dateUtils";

// Stan początkowy filtrów
const initialFilters = {
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  species: "all",
  applicantType: "all",
  language: "all",
};

const getLanguageLabel = (code) => {
  const map = {
    pl: "🇵🇱 Polski",
    en: "🇬🇧 English",
    es: "🇪🇸 Español",
  };
  return map[code] || code;
};

const AdminRequests = () => {
  const { t, i18n } = useTranslation("admin");

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

  // --- NOWE STANY: ALERT I CONFIRM ---
  const [alert, setAlert] = useState(null); // { variant, message }
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

  // --- 3. LOGIKA ZMIANY STATUSU Z CONFIRM I ALERTEM ---

  // Krok 1: Wywołanie okna potwierdzenia
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

  // Krok 2: Faktyczne wykonanie zmiany (po kliknięciu "Potwierdź")
  const executeStatusChange = async () => {
    const { targetStatus } = confirmDialog;

    // Zamykamy dialog
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

    if (!selectedRequest || !targetStatus) return;

    try {
      await api.patch(`/requests/${selectedRequest.id}/status`, {
        status: targetStatus,
      });

      // SUKCES - Ustawiamy Alert
      setAlert({
        variant: "success",
        message:
          t("status.successMessage") || "Status został zmieniony pomyślnie!",
      });

      handleCloseDetails(); // Zamknij modal szczegółów
      fetchRequests(); // Odśwież listę
    } catch (err) {
      console.error("Błąd zmiany statusu:", err);
      // BŁĄD - Ustawiamy Alert
      setAlert({
        variant: "error",
        message:
          t("status.errorMessage") || "Wystąpił błąd podczas zmiany statusu.",
      });
    }
  };

  // Funkcja anulowania dialogu
  const cancelStatusChange = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleApprove = () => {
    // Zamiast ConfirmDialog, otwieramy kreator zbiórki
    setIsCreateProjectOpen(true);
    // (Możesz zamknąć modal szczegółów, jeśli chcesz, ale lepiej zostawić otwarty "pod spodem" lub zamknąć go)
    // Tutaj decydujesz: czy kreator jest "na wierzchu" szczegółów?
    // Jeśli tak, to użyj Portalu w CreateProjectModal (jest w kodzie Modala).
  };

  const handleProjectCreatedSuccess = () => {
    // Ta funkcja wykona się po sukcesie w modalu
    setAlert({
      variant: "success",
      message:
        t("status.projectCreatedSuccess") || "Zbiórka została utworzona!",
    });
    fetchRequests(); // Odśwież listę
    handleCloseDetails(); // Zamknij modal szczegółów
    // CreateProjectModal zamknie się sam w swoim kodzie (onClose)
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

  const sortOptions = [
    { value: "createdAt", label: t("filters.sortOptions.date") },
    { value: "deadline", label: t("filters.sortOptions.deadline") },
    { value: "amount", label: t("filters.sortOptions.amount") },
  ];

  const BooleanStatus = ({ value, label }) => (
    <span className={`status-tag ${value ? "positive" : "neutral"}`}>
      {value ? <Check size={14} /> : <Minus size={14} />}
      {label}
    </span>
  );

  // Stopka modala z przyciskami akcji
  const modalFooter =
    !isDetailsLoading && !detailsError && requestDetails ? (
      <>
        <Button variant="ghost" onClick={handleCloseDetails}>
          {t("actions.close")}
        </Button>

        {selectedRequest?.status === "pending" && (
          <>
            <Button
              variant="accent"
              icon={<X size={18} />}
              onClick={handleReject}
            >
              {t("actions.reject")}
            </Button>
            <Button
              variant="primary"
              icon={<Check size={18} />}
              onClick={handleApprove}
            >
              {t("actions.approve")}
            </Button>
          </>
        )}

        {selectedRequest?.status === "approved" && (
          <>
            <Button
              variant="secondary"
              icon={<RotateCcw size={18} />}
              onClick={handlePending}
            >
              {t("status.pending")}
            </Button>
            <Button
              variant="accent"
              icon={<X size={18} />}
              onClick={handleReject}
            >
              {t("actions.reject")}
            </Button>
          </>
        )}

        {selectedRequest?.status === "rejected" && (
          <>
            <Button
              variant="secondary"
              icon={<RotateCcw size={18} />}
              onClick={handlePending}
            >
              {t("status.pending")}
            </Button>
            <Button
              variant="primary"
              icon={<Check size={18} />}
              onClick={handleApprove}
            >
              {t("actions.approve")}
            </Button>
          </>
        )}
      </>
    ) : null;

  return (
    <div className="admin-requests-page">
      {/* PORTALE: Przenoszą te elementy na sam koniec <body>,
          dzięki czemu mają one najwyższy priorytet wyświetlania (z-index)
          i nie są przykrywane przez Modal.
      */}

      {/* 1. ALERT (TOAST) */}
      {alert &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              zIndex: 99999, // Bardzo wysoki indeks, by być nad wszystkim
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

      {/* 2. CONFIRM DIALOG */}
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

      {/* --- GŁÓWNA ZAWARTOŚĆ STRONY --- */}
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
            value={filters.language}
            onChange={(e) => handleFilterChange("language", e.target.value)}
          >
            <option value="all">{t("filters.allLanguages")}</option>
            <option value="pl">🇵🇱 Polski</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
          </select>
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
        request={requestDetails || selectedRequest} // Fallback to list data if details aren't loaded
        onSuccess={handleProjectCreatedSuccess}
      />

      {/* MODAL ZE SZCZEGÓŁAMI */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={handleCloseDetails}
        title={
          selectedRequest
            ? `${t("requests.detailsTitle")} #${selectedRequest.id}`
            : ""
        }
        size="lg"
        footer={modalFooter}
      >
        {isDetailsLoading ? (
          <Loader size="md" variant="center" />
        ) : detailsError ? (
          <ErrorState
            message={detailsError}
            onRetry={() => handleOpenDetails(selectedRequest)}
          />
        ) : requestDetails ? (
          <div className="request-details-view">
            {/* SEKCJA 1: WNIOSKODAWCY */}
            <section>
              <h3 className="detail-header">
                {t("requests.sections.applicantData")}
              </h3>
              <div className="detail-grid">
                <div className="info-group">
                  <span className="info-label">
                    {t("form.fields.applicantType.label")}
                  </span>
                  <span className="info-value">
                    {t(
                      `form.fields.applicantType.options.${requestDetails.applicantType}`
                    )}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">
                    {t("form.fields.fullName")}
                  </span>
                  <span className="info-value fw-bold">
                    {requestDetails.fullName}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">{t("form.fields.contact")}</span>
                  <div className="info-value">
                    <a href={`mailto:${requestDetails.email}`} className="link">
                      {requestDetails.email}
                    </a>
                    <br />
                    <a href={`tel:${requestDetails.phone}`} className="link">
                      {requestDetails.phone}
                    </a>
                  </div>
                </div>
                <div className="info-group">
                  <span className="info-label">
                    {t("form.fields.location")}
                  </span>
                  <span className="info-value">
                    {requestDetails.city}, {requestDetails.country}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">
                    {t("form.fields.sentDate")}
                  </span>
                  <span className="info-value">
                    {formatDate(requestDetails.createdAt, i18n.language)}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">
                    {t("form.fields.submissionLanguage")}
                  </span>
                  <span className="info-value">
                    {getLanguageLabel(requestDetails.submissionLanguage)}
                  </span>
                </div>
              </div>
            </section>

            <hr className="detail-divider" />

            {/* SEKCJA 2: O ZWIERZAKU */}
            <section>
              <h3 className="detail-header">
                {t("requests.sections.requestDetails")}
              </h3>
              <div className="detail-grid">
                <div className="info-group">
                  <span className="info-label">
                    {t("form.fields.animalName")}
                  </span>
                  <span className="info-value">
                    <strong>{requestDetails.animalName}</strong>
                    <span
                      className="text-muted"
                      style={{
                        fontWeight: 400,
                        display: "block",
                        marginTop: 4,
                      }}
                    >
                      {t(
                        `form.fields.species.options.${requestDetails.species}`
                      )}
                      {requestDetails.species === "other" &&
                        ` (${requestDetails.speciesOther})`}
                      , {requestDetails.age || "-"} {t("common.years")}
                    </span>
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">
                    {t("form.fields.animalsCount")}
                  </span>
                  <span className="info-value">
                    {requestDetails.animalsCount}
                  </span>
                </div>
                <div className="info-group highlight-box">
                  <span className="info-label">{t("form.fields.amount")}</span>
                  <span className="info-value money-display">
                    {requestDetails.amount} {requestDetails.currency}
                  </span>
                  <span className="info-sub text-muted">
                    {t(
                      `form.fields.amountType.options.${requestDetails.amountType}`
                    ) || requestDetails.amountType}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">
                    {t("form.fields.deadline")}
                  </span>
                  <span className="info-value date-badge">
                    {formatDate(requestDetails.deadline, i18n.language)}
                  </span>
                </div>
              </div>

              <div className="info-group full-width mt-4">
                <span className="info-label">
                  {t("form.fields.description")}
                </span>
                <div className="info-value text-block">
                  {requestDetails.description}
                </div>
              </div>

              {requestDetails.otherHelp && (
                <div className="info-group full-width mt-4">
                  <span className="info-label">
                    {t("form.fields.otherHelp")}
                  </span>
                  <div className="info-value text-block">
                    {requestDetails.otherHelp}
                  </div>
                </div>
              )}

              <div className="tags-container mt-3">
                <BooleanStatus
                  value={requestDetails.treatmentOngoing}
                  label={t("form.fields.treatmentOngoing")}
                />
                <BooleanStatus
                  value={requestDetails.needsInstallments}
                  label={t("form.fields.needsInstallments")}
                />
              </div>

              {requestDetails.otherFundraiserLink && (
                <div className="info-group mt-3">
                  <span className="info-label">
                    {t("form.fields.otherFundraiserLink")}
                  </span>
                  <a
                    href={requestDetails.otherFundraiserLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-link"
                  >
                    {t("actions.openLink")} <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </section>

            <hr className="detail-divider" />

            {/* SEKCJA 3: PLIKI */}
            <section>
              <h3 className="detail-header">
                {t("requests.sections.attachments")}
              </h3>

              {!requestDetails.petPhotos?.length &&
                !requestDetails.documents?.length && (
                  <p className="text-muted">{t("requests.noAttachments")}</p>
                )}

              {requestDetails.petPhotos?.length > 0 && (
                <div className="mb-3">
                  <span className="info-label d-block mb-2">
                    {t("form.fields.photos")} ({requestDetails.petPhotos.length}
                    )
                  </span>
                  <div className="file-previews">
                    {requestDetails.petPhotos.map((photo) => (
                      <div key={photo.id} className="file-preview">
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img src={photo.url} alt={photo.originalName} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {requestDetails.documents?.length > 0 && (
                <div className="info-group">
                  <span className="info-label d-block mb-2">
                    {t("form.fields.documents")} (
                    {requestDetails.documents.length})
                  </span>
                  <div className="file-list-container">
                    {requestDetails.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="simple-file-link"
                      >
                        <Download size={14} /> {doc.originalName}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <hr className="detail-divider" />

            {/* SEKCJA 4: WYPŁATA */}
            <details className="payout-details-group">
              <summary>{t("requests.sections.payoutData")}</summary>
              <div className="detail-grid">
                <div className="info-group">
                  <span className="info-label">
                    {t("form.fields.payoutName")}
                  </span>
                  <span className="info-value">
                    {requestDetails.payoutName}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">
                    {t("form.fields.bankName")}
                  </span>
                  <span className="info-value">
                    {requestDetails.payoutBankName} (
                    {requestDetails.payoutBankCountry})
                  </span>
                </div>
                <div className="info-group full-width">
                  <span className="info-label">{t("form.fields.iban")}</span>
                  <span className="info-value font-mono">
                    {requestDetails.payoutIban}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">{t("form.fields.swift")}</span>
                  <span className="info-value font-mono">
                    {requestDetails.payoutSwift}
                  </span>
                </div>
                <div className="info-group full-width">
                  <span className="info-label">{t("form.fields.address")}</span>
                  <span className="info-value">
                    {requestDetails.payoutAddress}
                  </span>
                </div>
              </div>
            </details>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AdminRequests;
