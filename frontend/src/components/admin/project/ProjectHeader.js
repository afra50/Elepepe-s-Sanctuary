import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink, Save, AlertTriangle } from "lucide-react";
import Button from "../../ui/Button";
import Alert from "../../ui/Alert";
// Import Twojego komponentu paska postępu
import ProgressBar from "../../ui/ProgressBar";

const ProjectHeader = ({
  formData,
  id,
  onBack,
  onSave,
  isSaving,
  activeLang,
  alert,
  setAlert,
}) => {
  const { t } = useTranslation("admin");

  // Obsługa kliknięcia w podgląd
  const handlePublicPreview = () => {
    if (formData.slug) {
      // Otwiera w nowej karcie
      window.open(`/projects/${formData.slug}`, "_blank");
    } else {
      // Fallback jeśli slug nie jest jeszcze ustawiony
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
            variant="outline"
            icon={<ExternalLink size={16} />}
            onClick={handlePublicPreview}
            disabled={!formData.slug} // Zablokuj jeśli brak sluga
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

        {/* Box Finansowy */}
        <div className="finance-summary-box">
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

          {/* Nowy Progress Bar */}
          <div style={{ marginTop: "0.75rem" }}>
            <ProgressBar
              current={formData.amountCollected}
              goal={formData.amountTarget}
            />
          </div>
        </div>
      </div>

      {alert && (
        <div className="mt-4">
          <Alert variant={alert.variant} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        </div>
      )}
    </header>
  );
};

export default ProjectHeader;
