import React from "react";
import { Globe } from "lucide-react";

const ProjectContentForm = ({
  formData,
  activeLangTab,
  setActiveLangTab,
  onLangChange,
}) => {
  return (
    <div className="form-section card">
      {/* Zakładki Językowe (używają stylów z _projectContentForm.scss poniżej) */}
      <div className="lang-tabs-container">
        <div className="tabs-list">
          {["pl", "en", "es"].map((lang) => (
            <button
              key={lang}
              className={`lang-tab ${activeLangTab === lang ? "active" : ""}`}
              onClick={() => setActiveLangTab(lang)}
            >
              <Globe size={14} className="mr-2" /> {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <h3 className="section-title">Treści ({activeLangTab.toUpperCase()})</h3>

      {/* UŻYCIE TWOJEJ KLASY .form-field */}
      <div className="form-field">
        <label>Tytuł zbiórki</label>
        <input
          type="text"
          value={formData.title[activeLangTab] || ""}
          onChange={(e) => onLangChange("title", e.target.value)}
          placeholder="Wpisz tytuł..."
        />
      </div>

      <div className="form-field">
        <label>Opis szczegółowy</label>
        <textarea
          rows={10}
          value={formData.description[activeLangTab] || ""}
          onChange={(e) => onLangChange("description", e.target.value)}
          placeholder="Opisz zbiórkę..."
        />
      </div>

      <div className="form-row">
        <div className="form-field half">
          <label>Kraj (Tekst wyświetlany)</label>
          <input
            type="text"
            value={formData.country[activeLangTab] || ""}
            onChange={(e) => onLangChange("country", e.target.value)}
          />
        </div>
        <div className="form-field half">
          <label>Wiek (Tekst wyświetlany)</label>
          <input
            type="text"
            value={formData.age[activeLangTab] || ""}
            onChange={(e) => onLangChange("age", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectContentForm;
