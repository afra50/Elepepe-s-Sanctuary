import React from "react";
import { useTranslation } from "react-i18next";
import Button from "../../ui/Button";

const ProjectSidebar = ({ formData, onChange }) => {
  const { t } = useTranslation("admin");

  // Formatowanie daty dla input type="datetime-local" (wymaga formatu YYYY-MM-DDTHH:MM)
  const formattedDeadline = formData.deadline
    ? new Date(formData.deadline).toISOString().slice(0, 16)
    : "";

  return (
    <>
      {/* --- KARTA 1: KONFIGURACJA --- */}
      <div className="card sidebar-card">
        <h3 className="section-title">Konfiguracja</h3>

        {/* Status - używa Twojej klasy .form-field */}
        <div className="form-field">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={onChange}>
            <option value="draft">Szkic (Niepubliczna)</option>
            <option value="active">Aktywna (Publiczna)</option>
            <option value="completed">Zakończona</option>
            <option value="cancelled">Anulowana</option>
          </select>
        </div>

        {/* Checkbox "PILNE" - używa Twojej struktury .checkbox */}
        <div className="form-field">
          <label className="checkbox">
            <input
              type="checkbox"
              name="isUrgent"
              checked={formData.isUrgent}
              onChange={onChange}
            />
            <span className="checkbox__box"></span>
            <div className="checkbox__text">
              <span className="checkbox__label" style={{ color: "#dc2626" }}>
                Oznacz jako PILNE
              </span>
            </div>
          </label>
        </div>

        <div className="form-field">
          <label>Slug (Link URL)</label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={onChange}
          />
        </div>

        <div className="form-field">
          <label>Deadline</label>
          <input
            type="datetime-local"
            name="deadline"
            value={formattedDeadline}
            onChange={onChange}
          />
        </div>
      </div>

      {/* --- KARTA 2: DANE ZWIERZAKA --- */}
      <div className="card sidebar-card mt-4">
        <h3 className="section-title">Dane zwierzęcia</h3>

        {/* Używamy klasy .info-list z nowego SCSS dla lepszego układu w sidebarze */}
        <div className="info-list">
          <div className="form-field">
            <label>Imię</label>
            <input
              type="text"
              name="animalName"
              value={formData.animalName}
              onChange={onChange}
            />
          </div>

          <div className="form-field">
            <label>Gatunek</label>
            <select name="species" value={formData.species} onChange={onChange}>
              <option value="rat">Szczur</option>
              <option value="guineaPig">Świnka</option>
              <option value="other">Inne</option>
            </select>
          </div>

          <div className="form-field">
            <label>Miasto</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={onChange}
            />
          </div>
        </div>
      </div>

      {/* --- KARTA 3: WNIOSKODAWCA (READ ONLY) --- */}
      <div className="card sidebar-card mt-4 applicant-info-box">
        <h3 className="section-title">Dane Wnioskodawcy</h3>

        <div className="applicant-details">
          <p className="applicant-name">{formData.fullName}</p>
          <p className="applicant-type">
            {t(`form.fields.applicantType.options.${formData.applicantType}`) ||
              formData.applicantType}
          </p>

          <div className="applicant-meta">
            <span>Zgłoszenie ID:</span>
            <strong>#{formData.requestId}</strong>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="w-full mt-3">
          Zobacz oryginalny wniosek
        </Button>
      </div>
    </>
  );
};

export default ProjectSidebar;
