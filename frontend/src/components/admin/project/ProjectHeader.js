import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  AlertTriangle,
  Edit2,
  Check,
  X,
} from "lucide-react";
import Button from "../../ui/Button";
import Alert from "../../ui/Alert";
import ProgressBar from "../../ui/ProgressBar";

const ProjectHeader = ({
  formData,
  id,
  onBack,
  onSave,
  onChange, // Potrzebne do edycji finansów
  isSaving,
  activeLang,
  alert,
  setAlert,
}) => {
  const { t } = useTranslation("admin");
  const [isEditingFinance, setIsEditingFinance] = useState(false);

  // Obsługa kliknięcia w podgląd
  const handlePublicPreview = () => {
    if (formData.slug) {
      window.open(`/projects/${formData.slug}`, "_blank");
    } else {
      console.warn("Brak sluga, nie można otworzyć podglądu");
    }
  };

  return (
    <header className="details-header">
      <div className="header-top">
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={onBack}>
          Wróć do listy
        </Button>
        <div className="header-actions">
          <Button
            variant="accent"
            icon={<ExternalLink size={16} />}
            onClick={handlePublicPreview}
            disabled={!formData.slug}
          >
            Podgląd publiczny
          </Button>
          <Button
            variant="primary"
            icon={<Save size={16} />}
            onClick={onSave}
            isLoading={isSaving}
          >
            Zapisz zmiany
          </Button>
        </div>
      </div>

      <div className="header-title-row">
        <div>
          <h1 className="page-title">
            {formData.title[activeLang] || formData.title["pl"] || "Bez tytułu"}
          </h1>
          <div className="meta-badges">
            <span className={`status-badge ${formData.status}`}>
              {t(`projects.fields.statusOptions.${formData.status}`) ||
                formData.status}
            </span>
            <span className="id-badge">ID: #{id}</span>
            {formData.isUrgent && (
              <span className="urgent-badge">
                <AlertTriangle size={12} /> PILNE
              </span>
            )}
          </div>
        </div>

        {/* --- BOX FINANSOWY --- */}
        <div className="finance-summary-box">
          <div className="finance-header">
            <span
              className={`finance-title ${isEditingFinance ? "active" : ""}`}
            >
              {isEditingFinance ? "Edycja finansów" : "Finanse"}
            </span>

            <button
              type="button"
              className="icon-btn-small"
              onClick={() => setIsEditingFinance(!isEditingFinance)}
              title="Edytuj kwoty"
            >
              {isEditingFinance ? <X size={16} /> : <Edit2 size={14} />}
            </button>
          </div>

          {!isEditingFinance ? (
            // --- TRYB PODGLĄDU ---
            <>
              <div className="fs-row">
                <span className="fs-label">Cel:</span>
                <span className="fs-value">
                  {formData.amountTarget} {formData.currency}
                </span>
              </div>
              <div className="fs-row">
                <span className="fs-label">Zebrano:</span>
                <span className="fs-value highlight">
                  {formData.amountCollected} {formData.currency}
                </span>
              </div>
            </>
          ) : (
            // --- TRYB EDYCJI ---
            <div className="finance-edit-grid">
              <div className="finance-input-group">
                <label>Cel:</label>
                <input
                  type="number"
                  name="amountTarget"
                  value={formData.amountTarget}
                  onChange={onChange}
                  className="mini-input"
                />
              </div>
              <div className="finance-input-group">
                <label>Zebrano:</label>
                <input
                  type="number"
                  name="amountCollected"
                  value={formData.amountCollected}
                  onChange={onChange}
                  className="mini-input"
                />
              </div>
              <div className="finance-input-group">
                <label>Waluta:</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={onChange}
                  className="mini-input"
                >
                  <option value="PLN">PLN</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="finance-actions">
                <button
                  className="btn-text-primary"
                  onClick={() => setIsEditingFinance(false)}
                >
                  <Check size={14} style={{ marginRight: 4 }} /> Gotowe
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="progress-wrapper">
            <ProgressBar
              current={formData.amountCollected}
              goal={formData.amountTarget}
            />
          </div>
        </div>
      </div>

      {alert && (
        <div className="alert-container">
          <Alert variant={alert.variant} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        </div>
      )}
    </header>
  );
};

export default ProjectHeader;
