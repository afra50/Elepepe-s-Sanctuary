import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Filter, Search, ArrowUpDown } from "lucide-react";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import RequestCard from "../../components/admin/RequestCard";
import api from "../../utils/api";
import { formatDate } from "../../utils/dateUtils";

const AdminRequests = () => {
  const { t, i18n } = useTranslation("admin");

  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // 3. POBIERANIE DANYCH Z BACKENDU
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Pobieramy WSZYSTKIE zgłoszenia naraz.
        // Dzięki temu przełączanie zakładek (Pending/Approved) działa błyskawicznie bez ładowania.
        const response = await api.get("/requests");

        const formattedData = response.data.map((req) => ({
          ...req,
          createdAt: formatDate(req.createdAt, i18n.language),
          deadline: formatDate(req.deadline, i18n.language),
        }));

        setRequests(formattedData);
      } catch (err) {
        console.error("Error fetching requests:", err);
        // api.js obsłuży 401 (wylogowanie), tutaj łapiemy inne błędy (np. 500)
        setError(t("requests.fetchError") || "Nie udało się pobrać zgłoszeń.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [t, i18n.language]);

  // Filtrowanie po statusie (frontendowe)
  const filteredRequests = requests.filter((req) => req.status === activeTab);

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

      {/* ... (TABS BEZ ZMIAN) ... */}
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
              <RequestCard
                key={req.id}
                req={req}
                onClick={() => setSelectedRequest(req)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Placeholder */}
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
            <h2>Szczegóły: {selectedRequest.fullName}</h2>
            {/* Tutaj wyświetlisz pełne dane z selectedRequest */}
            <pre>{JSON.stringify(selectedRequest, null, 2)}</pre>
            <Button onClick={() => setSelectedRequest(null)}>Zamknij</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
