import React from "react";

const ProjectContentForm = ({
  formData,
  activeLangTab,
  setActiveLangTab,
  onLangChange,
}) => {
  // Mapa języków na etykiety
  const languages = [
    { code: "pl", label: "Polski" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
  ];

  return (
    <div className="form-section card">
      {/* Zakładki Językowe */}
      <div className="lang-tabs-container">
        <div className="tabs-list">
          {languages.map(({ code, label }) => (
            <button
              key={code}
              className={`lang-tab ${activeLangTab === code ? "active" : ""}`}
              onClick={() => setActiveLangTab(code)}
            >
              {/* Wyświetlanie flagi z public/flags/ */}
              <img
                src={`/flags/${code}.svg`}
                alt={label}
                className="tab-flag"
                onError={(e) => (e.target.style.display = "none")} // Ukryj jeśli brak pliku
              />
              {label}
            </button>
          ))}
        </div>
      </div>

      <h3 className="section-title">Treści ({activeLangTab.toUpperCase()})</h3>

      <div className="form-field">
        <label>Tytuł zbiórki</label>
        <input
          type="text"
          value={formData.title[activeLangTab] || ""}
          onChange={(e) => onLangChange("title", e.target.value)}
          placeholder={`Wpisz tytuł (${activeLangTab})...`}
        />
      </div>

      <div className="form-field">
        <label>Opis szczegółowy</label>
        <textarea
          rows={10}
          value={formData.description[activeLangTab] || ""}
          onChange={(e) => onLangChange("description", e.target.value)}
          placeholder={`Opisz zbiórkę (${activeLangTab})...`}
        />
      </div>

      <div className="form-row">
        <div className="form-field half">
          <label>Kraj</label>
          <input
            type="text"
            value={formData.country[activeLangTab] || ""}
            onChange={(e) => onLangChange("country", e.target.value)}
          />
        </div>
        <div className="form-field half">
          <label>Wiek</label>
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
