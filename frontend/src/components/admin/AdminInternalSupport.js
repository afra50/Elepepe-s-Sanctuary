import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Calendar } from "lucide-react";
import api from "../../utils/api";

// Importy komponentów UI
import Button from "../ui/Button";
import Loader from "../ui/Loader";
import Alert from "../ui/Alert";
import ErrorState from "../ui/ErrorState";
import ConfirmDialog from "../ui/ConfirmDialog";
import DatePickerField from "../ui/DatePickerField";

const AdminInternalSupport = () => {
  const { t, i18n } = useTranslation("admin");
  const lang = i18n.language || "pl";

  // --- STANY DANYCH ---
  const [donations, setDonations] = useState([]);
  const [projects, setProjects] = useState([]);

  // --- STANY UI ---
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null); // Błąd krytyczny (brak danych)
  const [actionAlert, setActionAlert] = useState(null); // Alert sukcesu/błędu akcji
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // ID do usunięcia

  // --- STAN FORMULARZA ---
  const [formData, setFormData] = useState({
    project_id: "",
    amount: "",
    currency: "PLN",
    donation_date: new Date().toISOString().split("T")[0],
    note: "",
  });

  // --- 1. POBIERANIE DANYCH ---
  const fetchData = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const [donationsRes, projectsRes] = await Promise.all([
        api.get("/internal-donations"),
        api.get("/projects/admin?status=active"), // Tylko aktywne projekty do listy
      ]);
      setDonations(donationsRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error("Error fetching data", err);
      setPageError("Nie udało się pobrać listy wpłat lub projektów.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. HANDLERY FORMULARZA ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (dateString) => {
    setFormData({ ...formData, donation_date: dateString });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prosta walidacja
    if (!formData.project_id || !formData.amount) {
      setActionAlert({
        variant: "error",
        message: "Wybierz projekt i podaj kwotę.",
      });
      return;
    }

    try {
      const res = await api.post("/internal-donations", formData);

      // Sukces
      setActionAlert({
        variant: "success",
        message: "Wpłata została dodana pomyślnie.",
      });

      // Dodaj nową wpłatę do listy lokalnie (żeby nie przeładowywać wszystkiego)
      // Uwaga: Backend powinien zwrócić pełny obiekt wpłaty, ale jeśli nie zwraca tytułu projektu,
      // musimy go "dokleić" ręcznie dla UI, albo po prostu odświeżyć listę.
      // Najbezpieczniej:
      fetchData();

      // Reset formularza i zamknięcie
      setFormData({
        ...formData,
        amount: "",
        note: "",
        project_id: "", // Resetuj wybór projektu
        donation_date: new Date().toISOString().split("T")[0], // Data dzisiejsza
      });
      setIsFormVisible(false);
    } catch (err) {
      console.error("Error adding donation", err);
      setActionAlert({
        variant: "error",
        message: "Błąd podczas zapisywania wpłaty.",
      });
    }
  };

  // --- 3. HANDLERY USUWANIA ---
  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      await api.delete(`/internal-donations/${confirmDeleteId}`);
      setActionAlert({
        variant: "success",
        message: "Wpłata została usunięta.",
      });
      // Aktualizacja stanu lokalnego
      setDonations((prev) => prev.filter((d) => d.id !== confirmDeleteId));
    } catch (err) {
      console.error("Error deleting", err);
      setActionAlert({
        variant: "error",
        message: "Nie udało się usunąć wpłaty.",
      });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // --- HELPERY ---
  const getProjectTitle = (project) => {
    if (!project || !project.title) return "Usunięty projekt";
    try {
      // Obsługa tytułu wielojęzycznego (JSON string lub obiekt)
      const titleObj =
        typeof project.title === "string"
          ? JSON.parse(project.title)
          : project.title;
      return titleObj[lang] || titleObj["pl"] || "Bez tytułu";
    } catch (e) {
      return project.title;
    }
  };

  // --- RENDEROWANIE ---
  return (
    <div className="admin-internal-support">
      {/* NAGŁÓWEK - ZAWSZE WIDOCZNY */}
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            {t("menu.foundationSupport") || "Wpłaty własne"}
          </h1>
          <p className="page-subtitle">
            Zarządzaj środkami wpłacanymi przez fundację na zbiórki.
          </p>
        </div>

        {/* Przycisk dodawania widoczny tylko gdy nie ma błędu krytycznego */}
        {!pageError && !loading && (
          <div className="header-actions">
            <Button
              variant={isFormVisible ? "secondary" : "primary"}
              icon={isFormVisible ? null : <Plus size={18} />}
              onClick={() => setIsFormVisible(!isFormVisible)}
            >
              {isFormVisible ? "Anuluj dodawanie" : "Dodaj wpłatę"}
            </Button>
          </div>
        )}
      </header>

      {/* ALERT AKCJI (Toast) */}
      {actionAlert && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Alert
            variant={actionAlert.variant}
            onClose={() => setActionAlert(null)}
            autoClose={5000}
          >
            {actionAlert.message}
          </Alert>
        </div>
      )}

      {/* OBSŁUGA STANU BŁĘDU KRYTYCZNEGO */}
      {pageError ? (
        <ErrorState
          title="Błąd wczytywania danych"
          message={pageError}
          onRetry={fetchData}
        />
      ) : loading ? (
        <Loader variant="center" size="lg" />
      ) : (
        <>
          {/* SEKJA FORMULARZA (ROZWIJANA) */}
          <div className={`form-collapsible ${isFormVisible ? "open" : ""}`}>
            <div className="form-card">
              <h3>Nowa wpłata</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {/* Wybór projektu */}
                  <div className="form-group">
                    <label htmlFor="project_id">Projekt</label>
                    <select
                      id="project_id"
                      name="project_id"
                      value={formData.project_id}
                      onChange={handleChange}
                    >
                      <option value="">-- Wybierz zbiórkę --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {getProjectTitle(p)} (ID: {p.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Data */}
                  <div className="form-group">
                    <label htmlFor="donation_date">Data wpłaty</label>
                    <DatePickerField
                      id="donation_date"
                      name="donation_date"
                      value={formData.donation_date}
                      onChange={handleDateChange}
                      placeholder="RRRR-MM-DD"
                    />
                  </div>

                  {/* Kwota i Waluta */}
                  <div className="form-group">
                    <label htmlFor="amount">Kwota</label>
                    <div className="amount-group">
                      <input
                        type="number"
                        step="0.01"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="form-input"
                      />
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                      >
                        <option value="PLN">PLN</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  {/* Notatka - pełna szerokość */}
                  <div className="form-group form-row-full">
                    <label htmlFor="note">Notatka (opcjonalnie)</label>
                    <input
                      type="text"
                      id="note"
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      placeholder="Np. pokrycie faktury FV/123/2025"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <Button type="submit" variant="success">
                    Zapisz wpłatę
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* TABELA DANYCH */}
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Projekt</th>
                  <th>Kwota</th>
                  <th>Notatka</th>
                  <th style={{ textAlign: "right" }}>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {donations.length === 0 ? (
                  <tr className="empty-state-row">
                    <td colSpan="5">Brak zarejestrowanych wpłat własnych.</td>
                  </tr>
                ) : (
                  donations.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div className="cell-date">
                          <Calendar size={14} />
                          {new Date(d.donation_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className="cell-highlight">
                          {d.project_title
                            ? getProjectTitle({ title: d.project_title })
                            : "Projekt usunięty"}
                        </span>
                      </td>
                      <td className="col-amount">
                        +{d.amount} {d.currency}
                      </td>
                      <td>
                        <div className="col-note" title={d.note}>
                          {d.note || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="cell-actions">
                          <button
                            className="action-btn-icon danger"
                            onClick={() => handleDeleteClick(d.id)}
                            title="Usuń wpłatę (cofnie saldo projektu)"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL POTWIERDZENIA */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        message="Czy na pewno chcesz usunąć tę wpłatę? Kwota zostanie odjęta od zebranej sumy w zbiórce."
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};

export default AdminInternalSupport;
