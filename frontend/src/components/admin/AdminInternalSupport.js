import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Calendar } from "lucide-react";
import api from "../../utils/api";

// UI Components
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
import CsvExportButton from "../ui/CsvExportButton";

const AdminInternalSupport = () => {
  const { t, i18n } = useTranslation("admin");
  const lang = i18n.language || "pl";

  // --- DATA STATE ---
  const [donations, setDonations] = useState([]);
  const [projects, setProjects] = useState([]);

  // --- UI STATE ---
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [actionAlert, setActionAlert] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // --- FILTER & PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    project_id: "",
    amount: "",
    currency: "PLN",
    donation_date: new Date().toISOString().split("T")[0],
    note: "",
  });

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const [donationsRes, projectsRes] = await Promise.all([
        api.get("/internal-donations"),
        api.get("/projects/admin?status=active"),
      ]);
      setDonations(donationsRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error("Error fetching data", err);
      setPageError(t("foundationSupport.alerts.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HELPERS ---
  const getProjectTitle = (projectOrTitle) => {
    const rawTitle = projectOrTitle?.title || projectOrTitle?.project_title;
    if (!rawTitle) return t("common.untitled");
    try {
      const titleObj =
        typeof rawTitle === "string" ? JSON.parse(rawTitle) : rawTitle;
      return titleObj[lang] || titleObj["pl"] || t("common.untitled");
    } catch (e) {
      return rawTitle;
    }
  };

  // --- PREPARE SELECT OPTIONS ---
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

  // --- 2. FILTER & SORT LOGIC ---
  const processedDonations = useMemo(() => {
    let result = [...donations];

    // Filter by project
    if (filterProjectId) {
      result = result.filter((d) => d.project_id === parseInt(filterProjectId));
    }

    // Filter by currency
    if (filterCurrency) {
      result = result.filter((d) => d.currency === filterCurrency);
    }

    // Sort
    result.sort((a, b) => {
      let valA, valB;
      if (sortBy === "amount") {
        valA = parseFloat(a.amount);
        valB = parseFloat(b.amount);
      } else {
        valA = new Date(a.donation_date).getTime();
        valB = new Date(b.donation_date).getTime();
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [donations, filterProjectId, filterCurrency, sortBy, sortOrder]);

  // --- 3. PAGINATION LOGIC ---
  const totalPages = Math.ceil(processedDonations.length / itemsPerPage);
  const paginatedDonations = processedDonations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterProjectId, filterCurrency, sortBy, sortOrder]);

  // --- 4. HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (dateString) => {
    setFormData({ ...formData, donation_date: dateString });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.project_id || !formData.amount) {
      setActionAlert({
        variant: "error",
        message: t("foundationSupport.alerts.validationError"),
      });
      return;
    }

    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setActionAlert({
        variant: "error",
        message: t("foundationSupport.alerts.amountPositive"),
      });
      return;
    }

    if (formData.note && formData.note.length > 1000) {
      setActionAlert({
        variant: "error",
        message: t("foundationSupport.alerts.noteTooLong"),
      });
      return;
    }

    try {
      await api.post("/internal-donations", formData);
      setActionAlert({
        variant: "success",
        message: t("foundationSupport.alerts.addSuccess"),
      });
      fetchData();
      setFormData({
        ...formData,
        amount: "",
        note: "",
        project_id: "",
        donation_date: new Date().toISOString().split("T")[0],
      });
      setIsFormVisible(false);
    } catch (err) {
      console.error("Error adding donation", err);
      const errorMsg =
        err.response?.data?.message || t("foundationSupport.alerts.addError");
      setActionAlert({
        variant: "error",
        message: errorMsg,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await api.delete(`/internal-donations/${confirmDeleteId}`);
      setActionAlert({
        variant: "success",
        message: t("foundationSupport.alerts.deleteSuccess"),
      });
      setDonations((prev) => prev.filter((d) => d.id !== confirmDeleteId));

      if (paginatedDonations.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      console.error("Error deleting", err);
      setActionAlert({
        variant: "error",
        message: t("foundationSupport.alerts.deleteError"),
      });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // --- RENDER ---
  return (
    <div className="admin-internal-support">
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">{t("foundationSupport.title")}</h1>
          <p className="page-subtitle">{t("foundationSupport.subtitle")}</p>
        </div>
        {!pageError && !loading && (
          <div className="header-actions">
            <CsvExportButton
              filenamePrefix="internal_donations"
              exportUrl="/internal-donations/export"
            />
            <Button
              variant={isFormVisible ? "secondary" : "primary"}
              icon={isFormVisible ? null : <Plus size={18} />}
              onClick={() => setIsFormVisible(!isFormVisible)}
            >
              {isFormVisible
                ? t("foundationSupport.cancelAdd")
                : t("foundationSupport.add")}
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

      {pageError ? (
        <ErrorState
          title={t("foundationSupport.alerts.fetchError")}
          message={pageError}
          onRetry={fetchData}
        />
      ) : loading ? (
        <Loader variant="center" size="lg" />
      ) : (
        <>
          {/* --- FORM SECTION --- */}
          <div className={`form-collapsible ${isFormVisible ? "open" : ""}`}>
            <div className="form-card">
              <h3>{t("foundationSupport.newDonation")}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {/* Project Select */}
                  <div className="form-field">
                    <label htmlFor="project_id">
                      {t("foundationSupport.fields.project")}
                    </label>
                    <SearchableSelect
                      options={projectOptions}
                      value={formData.project_id}
                      onChange={(val) =>
                        setFormData({ ...formData, project_id: val })
                      }
                      placeholder={t(
                        "foundationSupport.fields.projectPlaceholder"
                      )}
                    />
                  </div>

                  {/* Date Picker */}
                  <div className="form-field">
                    <label htmlFor="donation_date">
                      {t("foundationSupport.fields.date")}
                    </label>
                    <DatePickerField
                      id="donation_date"
                      name="donation_date"
                      value={formData.donation_date}
                      onChange={handleDateChange}
                      placeholder="RRRR-MM-DD"
                      minDate={null}
                    />
                  </div>

                  {/* Amount & Currency */}
                  <div className="form-field">
                    <label htmlFor="amount">
                      {t("foundationSupport.fields.amount")}
                    </label>
                    <div className="amount-row">
                      <input
                        type="number"
                        step="0.01"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="amount-input"
                      />
                      <div className="currency-select-wrapper">
                        <Select
                          value={formData.currency}
                          onChange={(val) =>
                            setFormData({ ...formData, currency: val })
                          }
                          options={currencyOptions}
                          placeholder="PLN"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Note (Full Width) */}
                  <div className="form-field form-row-full">
                    <label htmlFor="note">
                      {t("foundationSupport.fields.note")}
                    </label>
                    <input
                      type="text"
                      id="note"
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      placeholder={t(
                        "foundationSupport.fields.notePlaceholder"
                      )}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <Button type="submit" variant="success">
                    {t("foundationSupport.save")}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* --- FILTER BAR --- */}
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
              setSortOrder("desc");
            }}
            sortOptions={[
              { value: "date", label: t("filters.sortOptions.date") },
              { value: "amount", label: t("filters.sortOptions.amount") },
            ]}
          >
            {/* Project Filter */}
            <div className="filter-item-project">
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

            {/* Currency Filter */}
            <div className="filter-item-currency">
              <Select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e)}
                options={[
                  { value: "", label: t("filters.allCurrencies") },
                  ...currencyOptions,
                ]}
                placeholder={t("filters.filterByCurrency")}
              />
            </div>
          </FilterBar>

          {/* --- DATA TABLE --- */}
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("foundationSupport.table.date")}</th>
                  <th>{t("foundationSupport.table.project")}</th>
                  <th>{t("foundationSupport.table.amount")}</th>
                  <th>{t("foundationSupport.table.note")}</th>
                  <th style={{ textAlign: "right" }}>
                    {t("foundationSupport.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedDonations.length === 0 ? (
                  <tr className="empty-state-row">
                    <td colSpan="5">{t("foundationSupport.emptyState")}</td>
                  </tr>
                ) : (
                  paginatedDonations.map((d) => (
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
                            : t("foundationSupport.projectDeleted")}
                        </span>
                      </td>
                      <td className="col-amount">
                        {d.amount} {d.currency}
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
                            onClick={() => setConfirmDeleteId(d.id)}
                            title={t("actions.delete")}
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

          {/* --- PAGINATION --- */}
          <div className="pagination-wrapper">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        message={t("foundationSupport.confirmDelete")}
        confirmLabel={t("actions.delete")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};

export default AdminInternalSupport;
