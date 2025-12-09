import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  PawPrint,
  Coins,
  User,
  Building2,
  Stethoscope,
  Filter,
  Search,
  ArrowUpDown,
  MapPin,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
// import api from "../../utils/api"; // Odkomentuj jak będziesz podpinać API

const LanguageFlag = ({ langCode }) => {
  const code = langCode ? langCode.toLowerCase() : "en";
  return (
    <img
      src={`/flags/${code}.svg`}
      alt={code}
      className="flag-icon"
      onError={(e) => {
        e.target.src = "/flags/en.svg";
      }}
    />
  );
};

const AdminRequests = () => {
  const { t } = useTranslation("admin");

  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null); // Do modala

  // Mocki
  const mockRequests = [
    {
      id: 1,
      applicantType: "person",
      fullName: "Jan Kowalski",
      amount: 2500,
      currency: "PLN",
      deadline: "2024-05-20",
      species: "rat",
      animalsCount: 2,
      submissionLanguage: "pl",
      createdAt: "2024-02-15",
      status: "pending",
    },
    {
      id: 2,
      applicantType: "organization",
      fullName: "Fundacja Ogonki",
      amount: 500,
      currency: "EUR",
      deadline: "2024-06-01",
      species: "guineaPig",
      animalsCount: 5,
      submissionLanguage: "en",
      createdAt: "2024-02-14",
      status: "pending",
    },
    {
      id: 3,
      applicantType: "vetClinic",
      fullName: "Klinika Weterynaryjna 'Zdrowa Łapka'",
      amount: 1200,
      currency: "PLN",
      deadline: "2024-04-10",
      species: "other",
      animalsCount: 1,
      submissionLanguage: "es",
      createdAt: "2024-02-10",
      status: "approved",
    },
  ];

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        // const response = await api.get('/requests');
        // setRequests(response.data);
        setTimeout(() => {
          setRequests(mockRequests);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        setError(t("requests.fetchError") || "Nie udało się pobrać zgłoszeń.");
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, [t]);

  const filteredRequests = requests.filter((req) => req.status === activeTab);

  const getApplicantIcon = (type) => {
    switch (type) {
      case "organization":
        return <Building2 size={18} />;
      case "vetClinic":
        return <Stethoscope size={18} />;
      default:
        return <User size={18} />;
    }
  };

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
          <Button variant="outline" size="sm" icon={<Filter size={16} />}>
            {t("actions.filter") || "Filtry"}
          </Button>
          <Button variant="outline" size="sm" icon={<ArrowUpDown size={16} />}>
            {t("actions.sort") || "Sortuj"}
          </Button>
        </div>
      </header>

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

      <div className="requests-content">
        {isLoading ? (
          <div className="loading-state">
            <Loader size="lg" variant="center" />
          </div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : filteredRequests.length === 0 ? (
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
            {filteredRequests.map((req) => (
              // CAŁA KARTA JEST KLIKALNA
              <article
                key={req.id}
                className="request-card clickable"
                onClick={() => setSelectedRequest(req)} // Tu otworzysz modal (później)
              >
                <div className="card-top">
                  <div className={`applicant-badge ${req.applicantType}`}>
                    {getApplicantIcon(req.applicantType)}
                    <span>
                      {t(
                        `form.fields.applicantType.options.${req.applicantType}`
                      ) || req.applicantType}
                    </span>
                  </div>
                  <div
                    className="lang-flag"
                    title={`Język: ${req.submissionLanguage}`}
                  >
                    <LanguageFlag langCode={req.submissionLanguage} />
                  </div>
                </div>

                <div className="card-body">
                  <h3 className="applicant-name">{req.fullName}</h3>
                  <div className="meta-row">
                    <span className="country-info">
                      <MapPin size={14} />{" "}
                      {req.country ||
                        t("requests.unknownCountry") ||
                        "Nieznany kraj"}
                    </span>
                    <span className="date-info">
                      {t("requests.sentDate") || "Wysłano"}: {req.createdAt}
                    </span>
                  </div>

                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">
                        <Coins size={14} />{" "}
                        {t("form.fields.amount.label") || "Kwota"}
                      </span>
                      <span className="value money">
                        {req.amount} {req.currency}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">
                        <Calendar size={14} />{" "}
                        {t("form.fields.deadline.label") || "Termin"}
                      </span>
                      <span className="value">{req.deadline}</span>
                    </div>
                    <div className="info-item full-width">
                      <span className="label">
                        <PawPrint size={14} />{" "}
                        {t("form.sections.animal") || "Zwierzak"}
                      </span>
                      <span className="value">
                        {t(`form.fields.species.options.${req.species}`) ||
                          req.species}
                        {/* Tłumaczenie liczby zwierząt */}
                        {req.animalsCount > 1 && ` (x${req.animalsCount})`}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* TODO: Tutaj wstawisz komponent Modal ze szczegółami, gdy selectedRequest !== null */}
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
            }}
          >
            <h2>Szczegóły (Placeholder)</h2>
            <p>ID: {selectedRequest.id}</p>
            <Button onClick={() => setSelectedRequest(null)}>Zamknij</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
