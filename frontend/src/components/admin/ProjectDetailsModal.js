import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Check } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { formatDate } from "../../utils/dateUtils";

const ProjectDetailsModal = ({
  isOpen,
  onClose,
  project,
  onStatusChange, // Funkcja do zmiany statusu (np. Aktywuj/Zakończ)
}) => {
  const { t, i18n } = useTranslation("admin");
  const [activeTabLang, setActiveTabLang] = useState(i18n.language || "pl");

  if (!project) return null;

  // Helper do JSONów
  const parseJson = (val) => {
    try {
      return typeof val === "string" ? JSON.parse(val) : val;
    } catch (e) {
      return {};
    }
  };

  const title = parseJson(project.title);
  const description = parseJson(project.description);
  const country = parseJson(project.country);
  const age = parseJson(project.age);
  const speciesOther = parseJson(project.speciesOther);

  // Stopka z akcjami
  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        {t("actions.close")}
      </Button>

      {/* Przykładowa akcja dla szkiców */}
      {project.status === "draft" && (
        <Button
          variant="primary"
          icon={<Check size={16} />}
          onClick={() => onStatusChange(project, "active")}
        >
          Aktywuj (TODO)
        </Button>
      )}
      <Button variant="outline" icon={<ExternalLink size={16} />}>
        {t("actions.openLink")}
      </Button>
    </>
  );

  // Style inline dla prostych tabów językowych wewnątrz modala
  const tabBtnStyle = (lang) => ({
    background: "none",
    border: "none",
    padding: "0.5rem",
    cursor: "pointer",
    fontWeight: activeTabLang === lang ? "bold" : "normal",
    borderBottom: activeTabLang === lang ? "2px solid #10b981" : "none",
    color: activeTabLang === lang ? "#10b981" : "#6b7280",
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("projects.detailsTitle") || "Szczegóły zbiórki"} #${
        project.id
      }`}
      size="lg"
      footer={footer}
    >
      <div className="request-details-view">
        {" "}
        {/* Używamy istniejącej klasy styli */}
        {/* SEKCJA 1: HEADER I STATUS */}
        <section>
          <h3 className="detail-header">Podstawowe informacje</h3>
          <div className="detail-grid">
            <div className="info-group">
              <span className="info-label">Status</span>
              {/* Tutaj możesz dodać klasy kolorów statusów jeśli masz je w CSS */}
              <span
                className="info-value fw-bold"
                style={{ textTransform: "uppercase" }}
              >
                {t(`projects.fields.statusOptions.${project.status}`) ||
                  project.status}
              </span>
            </div>
            <div className="info-group">
              <span className="info-label">
                {t("projects.fields.animalName")}
              </span>
              <span className="info-value fw-bold">{project.animalName}</span>
            </div>
            <div className="info-group">
              <span className="info-label">{t("projects.fields.species")}</span>
              <span className="info-value">
                {t(`form.fields.species.options.${project.species}`)}
                {project.species === "other" &&
                  ` (${speciesOther?.[activeTabLang]})`}
              </span>
            </div>
            <div className="info-group">
              <span className="info-label">{t("form.fields.location")}</span>
              <span className="info-value">
                {project.city}, {country[activeTabLang] || country["pl"]}
              </span>
            </div>
          </div>
        </section>
        <hr className="detail-divider" />
        {/* SEKCJA 2: TREŚCI (TABS) */}
        <section>
          <h3 className="detail-header">{t("projects.sections.content")}</h3>

          {/* Proste taby językowe */}
          <div
            className="mb-3"
            style={{
              display: "flex",
              gap: "1rem",
              borderBottom: "1px solid #eee",
            }}
          >
            {["pl", "en", "es"].map((lang) => (
              <button
                key={lang}
                style={tabBtnStyle(lang)}
                onClick={() => setActiveTabLang(lang)}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="info-group full-width mb-3">
            <span className="info-label">{t("projects.fields.title")}</span>
            <div className="info-value fw-bold">
              {title[activeTabLang] || "-"}
            </div>
          </div>
          <div className="info-group full-width">
            <span className="info-label">
              {t("projects.fields.description")}
            </span>
            <div className="info-value text-block">
              {description[activeTabLang] || "-"}
            </div>
          </div>
        </section>
        <hr className="detail-divider" />
        {/* SEKCJA 3: FINANSE */}
        <section>
          <h3 className="detail-header">{t("projects.sections.finance")}</h3>
          <div className="detail-grid">
            <div className="info-group highlight-box">
              <span className="info-label">Postęp zbiórki</span>
              <span className="money-display">
                {project.amountCollected} / {project.amountTarget}{" "}
                {project.currency}
              </span>
            </div>
            <div className="info-group">
              <span className="info-label">
                {t("projects.fields.deadline")}
              </span>
              <span className="info-value date-badge">
                {formatDate(project.deadline, i18n.language)}
              </span>
            </div>
            <div className="info-group">
              <span className="info-label">{t("projects.fields.age")}</span>
              <span className="info-value">{age?.[activeTabLang]}</span>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default ProjectDetailsModal;
