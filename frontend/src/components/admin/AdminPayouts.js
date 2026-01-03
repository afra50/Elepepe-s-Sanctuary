import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Trash2,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import api from "../../utils/api";

// Komponenty UI
import Button from "../ui/Button";
import Loader from "../ui/Loader";
import Alert from "../ui/Alert";
import ErrorState from "../ui/ErrorState";
import ConfirmDialog from "../ui/ConfirmDialog";
import DatePickerField from "../ui/DatePickerField";
import Pagination from "../ui/Pagination";
import FilterBar from "../ui/FilterBar";
import SearchableSelect from "../ui/SearchableSelect";
import Select from "../ui/Select";
import ProgressBar from "../ui/ProgressBar"; // <--- IMPORT TWOJEGO PROGRESS BARA

const AdminPayouts = () => {
  const { t, i18n } = useTranslation("admin");
  const lang = i18n.language || "pl";

  // --- STANY ---
  const [payouts, setPayouts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [actionAlert, setActionAlert] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // --- FILTROWANIE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");

  // --- FORMULARZ ---
  const [formData, setFormData] = useState({
    project_id: "",
    recipient_name: "",
    amount: "",
    currency: "PLN",
    payout_date: new Date().toISOString().split("T")[0],
    note: "",
  });

  // --- POBIERANIE DANYCH ---
  const fetchData = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const [payoutsRes, projectsRes] = await Promise.all([
        api.get("/payouts"),
        api.get("/projects/admin"),
      ]);
      setPayouts(payoutsRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error(err);
      setPageError(t("payouts.alerts.fetchError") || "Błąd pobierania danych");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HELPERY ---
  const getProjectTitle = (p) => {
    if (!p) return "";
    try {
      const titleObj =
        typeof p.title === "string" ? JSON.parse(p.title) : p.title;
      return titleObj[lang] || titleObj["pl"] || "Bez tytułu";
    } catch (e) {
      return p.title || "";
    }
  };

  const projectOptions = useMemo(() => {
    return projects.map((p) => ({
      value: p.id,
      label: `${getProjectTitle(p)} (ID: ${p.id})`,
    }));
  }, [projects, lang]);

  const currencyOptions = [
    { value: "PLN", label: "PLN" },
    { value: "EUR", label: "EUR" },
  ];

  // --- STATYSTYKI FILTRA (NAD TABELĄ) ---
  const filterProjectStats = useMemo(() => {
    if (!filterProjectId) return null;
    const proj = projects.find((p) => p.id === parseInt(filterProjectId));
    if (!proj) return null;

    const collected = parseFloat(
      proj.amountCollected || proj.amount_collected || 0
    );
    const paid = parseFloat(proj.amountPaid || proj.amount_paid || 0);
    const target = parseFloat(proj.amountTarget || proj.amount_target || 0);
    const remaining = collected - paid;

    return {
      title: getProjectTitle(proj),
      collected,
      paid,
      target,
      remaining,
      currency: proj.currency || "PLN",
    };
  }, [filterProjectId, projects, lang]);

  // --- STATYSTYKI FORMULARZA ---
  const formProjectStats = useMemo(() => {
    if (!formData.project_id) return null;
    const proj = projects.find((p) => p.id === formData.project_id);
    if (!proj) return null;
    const collected = parseFloat(
      proj.amountCollected || proj.amount_collected || 0
    );
    const paid = parseFloat(proj.amountPaid || proj.amount_paid || 0);
    const remaining = collected - paid;
    return { remaining, currency: proj.currency || "PLN" };
  }, [formData.project_id, projects]);

  // --- FILTROWANIE TABELI ---
  const processedPayouts = useMemo(() => {
    let result = [...payouts];
    if (filterProjectId)
      result = result.filter((p) => p.project_id === parseInt(filterProjectId));
    if (filterCurrency)
      result = result.filter((p) => p.currency === filterCurrency);

    result.sort((a, b) => {
      let valA, valB;
      if (sortBy === "amount") {
        valA = parseFloat(a.amount);
        valB = parseFloat(b.amount);
      } else {
        valA = new Date(a.payout_date).getTime();
        valB = new Date(b.payout_date).getTime();
      }
      return sortOrder === "asc"
        ? valA > valB
          ? 1
          : -1
        : valA < valB
        ? 1
        : -1;
    });
    return result;
  }, [payouts, filterProjectId, filterCurrency, sortBy, sortOrder]);

  const totalPages = Math.ceil(processedPayouts.length / itemsPerPage);
  const paginatedPayouts = processedPayouts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterProjectId, filterCurrency, sortBy, sortOrder]);

  // --- HANDLERY ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project_id || !formData.amount || !formData.recipient_name) {
      setActionAlert({
        variant: "error",
        message: t("payouts.alerts.validationError"),
      });
      return;
    }
    const amountVal = parseFloat(formData.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setActionAlert({
        variant: "error",
        message: t("payouts.alerts.amountPositive"),
      });
      return;
    }
    try {
      await api.post("/payouts", formData);
      setActionAlert({
        variant: "success",
        message: t("payouts.alerts.addSuccess"),
      });
      fetchData();
      setFormData({ ...formData, amount: "", note: "", recipient_name: "" });
      setIsFormVisible(false);
    } catch (err) {
      setActionAlert({
        variant: "error",
        message: t("payouts.alerts.addError"),
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await api.delete(`/payouts/${confirmDeleteId}`);
      setActionAlert({
        variant: "success",
        message: t("payouts.alerts.deleteSuccess"),
      });
      setPayouts((prev) => prev.filter((p) => p.id !== confirmDeleteId));
      const projectsRes = await api.get("/projects/admin");
      setProjects(projectsRes.data);
    } catch (err) {
      setActionAlert({
        variant: "error",
        message: t("payouts.alerts.deleteError"),
      });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="admin-payouts">
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">{t("payouts.title")}</h1>
          <p className="page-subtitle">{t("payouts.subtitle")}</p>
        </div>
        {!pageError && !loading && (
          <div className="header-actions">
            <Button
              variant={isFormVisible ? "secondary" : "primary"}
              icon={isFormVisible ? null : <Plus size={18} />}
              onClick={() => setIsFormVisible(!isFormVisible)}
            >
              {isFormVisible ? t("payouts.cancelAdd") : t("payouts.add")}
            </Button>
          </div>
        )}
      </header>

      {actionAlert && (
        <div className="alert-wrapper">
          <Alert
            variant={actionAlert.variant}
            onClose={() => setActionAlert(null)}
            autoClose={5000}
          >
            {actionAlert.message}
          </Alert>
        </div>
      )}

      {/* --- FORMULARZ --- */}
      <div className={`form-collapsible ${isFormVisible ? "open" : ""}`}>
        <div className="form-card">
          <h3>{t("payouts.newPayout")}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field form-full-width">
                <label>{t("payouts.fields.project")}</label>
                <SearchableSelect
                  options={projectOptions}
                  value={formData.project_id}
                  onChange={(val) =>
                    setFormData({ ...formData, project_id: val })
                  }
                  placeholder={t("payouts.fields.projectPlaceholder")}
                />
                {formProjectStats && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      marginTop: "5px",
                      color: "#666",
                    }}
                  >
                    Dostępne środki w tej zbiórce:{" "}
                    <strong>
                      {formProjectStats.remaining.toFixed(2)}{" "}
                      {formProjectStats.currency}
                    </strong>
                  </div>
                )}
              </div>
              <div className="form-field">
                <label>{t("payouts.fields.recipient")}</label>
                <input
                  type="text"
                  value={formData.recipient_name}
                  onChange={(e) =>
                    setFormData({ ...formData, recipient_name: e.target.value })
                  }
                  placeholder="Np. Jan Kowalski"
                />
              </div>
              <div className="form-field">
                <label>{t("payouts.fields.date")}</label>
                <DatePickerField
                  id="payout_date"
                  name="payout_date"
                  value={formData.payout_date}
                  onChange={(date) =>
                    setFormData({ ...formData, payout_date: date })
                  }
                  minDate={null}
                />
              </div>
              <div className="form-field">
                <label>{t("payouts.fields.amount")}</label>
                <div className="amount-input-group">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0.00"
                    className="input-number"
                  />
                  <div className="select-wrapper">
                    <Select
                      options={currencyOptions}
                      value={formData.currency}
                      onChange={(val) =>
                        setFormData({ ...formData, currency: val })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="form-field">
                <label>{t("payouts.fields.note")}</label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="Np. I rata za leczenie"
                />
              </div>
            </div>
            <div className="form-actions">
              <Button type="submit" variant="success">
                {t("payouts.save")}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* --- PASEK FILTRÓW --- */}
      <FilterBar
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSortBy}
        onOrderToggle={() =>
          setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
        }
        onClear={() => {
          setFilterProjectId("");
          setFilterCurrency("");
          setSortBy("date");
        }}
        sortOptions={[
          { value: "date", label: t("filters.sortOptions.date") },
          { value: "amount", label: t("filters.sortOptions.amount") },
        ]}
      >
        <div className="filter-project">
          <SearchableSelect
            options={[
              { value: "", label: t("filters.allProjects") },
              ...projectOptions,
            ]}
            value={filterProjectId ? parseInt(filterProjectId) : ""}
            onChange={(val) => setFilterProjectId(val)}
            placeholder={t("filters.filterByProject")}
          />
        </div>
        <div className="filter-currency">
          <Select
            value={filterCurrency}
            onChange={(val) => setFilterCurrency(val)}
            options={[
              { value: "", label: t("filters.allCurrencies") },
              ...currencyOptions,
            ]}
            placeholder={t("filters.filterByCurrency")}
          />
        </div>
      </FilterBar>

      {/* --- DASHBOARD FINANSOWY --- */}
      {filterProjectStats && (
        <div className="financial-dashboard">
          <div className="dashboard-header">
            <h4>Podsumowanie finansowe: {filterProjectStats.title}</h4>
          </div>
          <div className="dashboard-cards">
            {/* KARTA 1: ZEBRANO */}
            <div className="dashboard-card green">
              <div className="icon-wrapper">
                <TrendingUp size={24} />
              </div>
              <div className="card-content">
                <span className="card-label">
                  {t("payouts.summary.collected")}
                </span>
                <span className="card-value">
                  {filterProjectStats.collected.toFixed(2)}{" "}
                  <small>{filterProjectStats.currency}</small>
                </span>
              </div>
            </div>

            {/* KARTA 2: WYPŁACONO */}
            <div className="dashboard-card orange">
              <div className="icon-wrapper">
                <ArrowUpRight size={24} />
              </div>
              <div className="card-content">
                <span className="card-label">{t("payouts.summary.paid")}</span>
                <span className="card-value">
                  {filterProjectStats.paid.toFixed(2)}{" "}
                  <small>{filterProjectStats.currency}</small>
                </span>
              </div>
            </div>

            {/* KARTA 3: DO WYPŁATY */}
            <div
              className={`dashboard-card big ${
                filterProjectStats.remaining < 0 ? "red" : "blue"
              }`}
            >
              <div className="icon-wrapper">
                <Wallet size={28} />
              </div>
              <div className="card-content">
                <span className="card-label">
                  {t("payouts.summary.remaining")}
                </span>
                <span className="card-value">
                  {filterProjectStats.remaining.toFixed(2)}{" "}
                  <small>{filterProjectStats.currency}</small>
                </span>
              </div>
            </div>
          </div>

          {/* DWA PASKI POSTĘPU */}
          <div
            className="progress-section"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              marginTop: "1rem",
            }}
          >
            {/* 1. Postęp zbiórki (Current: Collected, Goal: Target) */}
            <div className="payout-progress-bar">
              <div
                className="progress-label"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  color: "#666",
                }}
              >
                <span>
                  Postęp zbiórki (Cel: {filterProjectStats.target}{" "}
                  {filterProjectStats.currency})
                </span>
              </div>
              <ProgressBar
                current={filterProjectStats.collected}
                goal={filterProjectStats.target}
              />
            </div>

            {/* 2. Wykorzystanie środków (Current: Paid, Goal: Collected) */}
            <div className="payout-progress-bar">
              <div
                className="progress-label"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  color: "#666",
                }}
              >
                <span>
                  Wykorzystanie zebranych środków (Zebrano:{" "}
                  {filterProjectStats.collected} {filterProjectStats.currency})
                </span>
              </div>
              {/* Używamy Twojego ProgressBar, ale goal to collected amount */}
              <ProgressBar
                current={filterProjectStats.paid}
                goal={filterProjectStats.collected}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- TABELA DANYCH --- */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("payouts.table.date")}</th>
              <th>{t("payouts.table.recipient")}</th>
              {!filterProjectId && <th>{t("payouts.table.project")}</th>}
              <th>{t("payouts.table.amount")}</th>
              <th>{t("payouts.table.note")}</th>
              <th style={{ textAlign: "right" }}>
                {t("foundationSupport.table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedPayouts.length === 0 ? (
              <tr className="empty-state-row">
                <td colSpan="6">{t("payouts.emptyState")}</td>
              </tr>
            ) : (
              paginatedPayouts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-date">
                      <Calendar size={14} />
                      {new Date(p.payout_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <strong className="recipient-name">
                      {p.recipient_name}
                    </strong>
                  </td>
                  {!filterProjectId && (
                    <td>
                      <span className="cell-highlight project-title">
                        {p.project_title
                          ? getProjectTitle({ title: p.project_title })
                          : t("foundationSupport.projectDeleted")}
                      </span>
                    </td>
                  )}
                  <td className="col-amount-outflow">
                    {p.amount} {p.currency}
                  </td>
                  <td>
                    <div className="col-note">{p.note || "-"}</div>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button
                        className="action-btn-icon danger"
                        onClick={() => setConfirmDeleteId(p.id)}
                        title={t("common.delete")}
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

      <div style={{ marginTop: "1.5rem" }}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        message={t("payouts.confirmDelete")}
        variant="danger"
        confirmLabel={t("actions.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};

export default AdminPayouts;
