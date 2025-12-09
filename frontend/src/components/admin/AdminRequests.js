import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Filter, ExternalLink, Check, X as XIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import RequestCard from "../../components/admin/RequestCard";
import api from "../../utils/api";
import { formatDate } from "../../utils/dateUtils";
import SearchBar from "../ui/SearchBar";
import FilterBar from "../ui/FilterBar";
import Modal from "../ui/Modal";

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

  // Stan dla szczegółów pobieranych dynamicznie (jeśli endpoint listy nie zwraca wszystkiego)
  const [requestDetails, setRequestDetails] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [filters, setFilters] = useState(initialFilters);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // --- 1. POBIERANIE LISTY ---
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get("/requests");
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

  // --- 2. POBIERANIE SZCZEGÓŁÓW (Po kliknięciu w kartę) ---
  const handleOpenDetails = async (req) => {
    setSelectedRequest(req); // Ustawiamy podstawowe dane od razu (żeby modal się otworzył)
    setIsDetailsLoading(true);

    try {
      // Pobieramy pełne dane z plikami
      const response = await api.get(`/requests/${req.id}`);
      setRequestDetails(response.data);
    } catch (err) {
      console.error("Error fetching details:", err);
      // Fallback: używamy tego co mamy z listy
      setRequestDetails(req);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
    setRequestDetails(null);
  };

  // --- Handlery Filtrów ---
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  // --- Logika Filtrowania ---
  const processedRequests = useMemo(() => {
    let result = [...requests];
    result = result.filter((req) => req.status === activeTab);

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
        {/* ... (Header bez zmian) ... */}
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
              {t("actions.filter") || "Filtry"}
            </Button>
          </div>
        </div>
      </header>

      {/* ... (FilterBar i Tabs bez zmian) ... */}
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
            {t(`status.${status}`) || status}
            <span className="count-badge">
              {requests.filter((r) => r.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* LISTA */}
      <div className="requests-content">
        {isLoading ? (
          <div className="loading-state">
            <Loader size="lg" variant="center" />
          </div>
        ) : error ? (
          <div className="error-state">{error}</div>
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
                onClick={() => handleOpenDetails(req)} // <--- ZMIANA: używamy handlera
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedRequest}
        onClose={handleCloseDetails}
        title={
          selectedRequest
            ? `${t("requests.detailsTitle") || "Szczegóły wniosku"} #${
                selectedRequest.id
              }`
            : ""
        }
        size="lg"
        footer={
          <Button variant="outline" onClick={handleCloseDetails}>
            {t("actions.close") || "Zamknij"}
          </Button>
        }
      >
        {isDetailsLoading || !requestDetails ? (
          <Loader size="md" variant="center" />
        ) : (
          <div className="request-details-view">
            {/* SEKCJA: DANE WNIOSKODAWCY */}
            <section className="details-section">
              <h3 className="section-title">Wnioskodawca</h3>
              <div className="details-grid">
                <div className="form-field read-only">
                  <span className="label">Typ</span>
                  <div className="value">
                    {t(
                      `form.fields.applicantType.options.${requestDetails.applicantType}`
                    )}
                  </div>
                </div>
                <div className="form-field read-only">
                  <span className="label">Imię i nazwisko / Nazwa</span>
                  <div className="value">{requestDetails.fullName}</div>
                </div>
                <div className="form-field read-only">
                  <span className="label">Email</span>
                  <div className="value">
                    <a href={`mailto:${requestDetails.email}`}>
                      {requestDetails.email}
                    </a>
                  </div>
                </div>
                <div className="form-field read-only">
                  <span className="label">Telefon</span>
                  <div className="value">
                    <a href={`tel:${requestDetails.phone}`}>
                      {requestDetails.phone}
                    </a>
                  </div>
                </div>
                <div className="form-field read-only">
                  <span className="label">Lokalizacja</span>
                  <div className="value">
                    {requestDetails.city ? `${requestDetails.city}, ` : ""}
                    {requestDetails.country}
                  </div>
                </div>
              </div>
            </section>

            <hr className="divider" />

            {/* SEKCJA: DANE ZWIERZĘCIA I ZBIÓRKI */}
            <section className="details-section">
              <h3 className="section-title">O Zwierzaku i Zbiórce</h3>
              <div className="details-grid">
                <div className="form-field read-only">
                  <span className="label">Imię zwierzaka</span>
                  <div className="value">{requestDetails.animalName}</div>
                </div>
                <div className="form-field read-only">
                  <span className="label">Gatunek</span>
                  <div className="value">
                    {t(`form.fields.species.options.${requestDetails.species}`)}
                    {requestDetails.species === "other" &&
                      ` (${requestDetails.speciesOther})`}
                  </div>
                </div>
                <div className="form-field read-only">
                  <span className="label">Wiek</span>
                  <div className="value">{requestDetails.age || "-"}</div>
                </div>
                <div className="form-field read-only">
                  <span className="label">Liczba zwierząt</span>
                  <div className="value">{requestDetails.animalsCount}</div>
                </div>

                {/* Finanse */}
                <div className="form-field read-only">
                  <span className="label">Wnioskowana Kwota</span>
                  <div className="value money">
                    {requestDetails.amount} {requestDetails.currency}
                    <span className="meta">({requestDetails.amountType})</span>
                  </div>
                </div>
                <div className="form-field read-only">
                  <span className="label">Termin (Deadline)</span>
                  <div className="value">
                    {formatDate(requestDetails.deadline, i18n.language)}
                  </div>
                </div>
              </div>

              {/* Opis - pełna szerokość */}
              <div className="form-field read-only mt-3">
                <span className="label">Opis sytuacji</span>
                <div className="value text-block">
                  {requestDetails.description}
                </div>
              </div>

              {/* Flagi logiczne */}
              <div className="flags-grid mt-3">
                <div
                  className={`flag-item ${
                    requestDetails.treatmentOngoing ? "active" : ""
                  }`}
                >
                  {requestDetails.treatmentOngoing ? (
                    <Check size={16} />
                  ) : (
                    <XIcon size={16} />
                  )}
                  <span>Leczenie w toku</span>
                </div>
                <div
                  className={`flag-item ${
                    requestDetails.needsInstallments ? "active" : ""
                  }`}
                >
                  {requestDetails.needsInstallments ? (
                    <Check size={16} />
                  ) : (
                    <XIcon size={16} />
                  )}
                  <span>Potrzebne raty</span>
                </div>
              </div>

              {requestDetails.otherFundraiserLink && (
                <div className="form-field read-only mt-2">
                  <span className="label">Inna zbiórka</span>
                  <div className="value">
                    <a
                      href={requestDetails.otherFundraiserLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-link"
                    >
                      {requestDetails.otherFundraiserLink}{" "}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
            </section>

            <hr className="divider" />

            {/* SEKCJA: PLIKI (Używamy klas z forms.scss) */}
            <section className="details-section">
              <h3 className="section-title">Załączniki</h3>

              {/* Zdjęcia */}
              {requestDetails.petPhotos &&
                requestDetails.petPhotos.length > 0 && (
                  <div className="mb-3">
                    <span className="label d-block mb-2">
                      Zdjęcia ({requestDetails.petPhotos.length})
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

              {/* Dokumenty */}
              {requestDetails.documents &&
                requestDetails.documents.length > 0 && (
                  <div>
                    <span className="label d-block mb-2">
                      Dokumenty ({requestDetails.documents.length})
                    </span>
                    <ul className="file-list">
                      {requestDetails.documents.map((doc) => (
                        <li key={doc.id} className="file-list__item">
                          <div className="file-list__dot"></div>
                          <span className="file-list__name">
                            {doc.originalName}
                          </span>
                          <div className="file-list__actions">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-list__btn file-list__btn--preview"
                            >
                              Pobierz
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </section>

            <hr className="divider" />

            {/* SEKCJA: DANE DO PRZELEWU */}
            <details className="payout-details-group">
              <summary>Dane do przelewu (Rozwiń)</summary>
              <div className="details-grid mt-3">
                <div className="form-field read-only">
                  <span className="label">Właściciel konta</span>
                  <div className="value">{requestDetails.payoutName}</div>
                </div>
                <div className="form-field read-only">
                  <span className="label">Bank</span>
                  <div className="value">
                    {requestDetails.payoutBankName} (
                    {requestDetails.payoutBankCountry})
                  </div>
                </div>
                <div className="form-field read-only full-width">
                  <span className="label">Numer konta (IBAN)</span>
                  <div className="value font-mono">
                    {requestDetails.payoutIban}
                  </div>
                </div>
                <div className="form-field read-only">
                  <span className="label">SWIFT/BIC</span>
                  <div className="value font-mono">
                    {requestDetails.payoutSwift}
                  </div>
                </div>
                <div className="form-field read-only full-width">
                  <span className="label">Adres właściciela</span>
                  <div className="value">{requestDetails.payoutAddress}</div>
                </div>
              </div>
            </details>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminRequests;
