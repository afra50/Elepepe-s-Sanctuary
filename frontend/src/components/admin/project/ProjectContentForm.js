import React from "react";
import { useTranslation } from "react-i18next";

const ProjectContentForm = ({
  formData,
  activeLangTab,
  setActiveLangTab,
  onLangChange,
}) => {
  const { t } = useTranslation("admin");

  // Lista kodów języków (etykiety pobieramy dynamicznie w renderze)
  const langCodes = ["pl", "en", "es"];

  return (
    <div className="form-section card">
      {/* Zakładki Językowe */}
      <div className="lang-tabs-container">
        <div className="tabs-list">
          {langCodes.map((code) => (
            <button
              key={code}
              className={`lang-tab ${activeLangTab === code ? "active" : ""}`}
              onClick={() => setActiveLangTab(code)}
            >
              {/* Wyświetlanie flagi */}
              <img
                src={`/flags/${code}.svg`}
                alt={code}
                className="tab-flag"
                onError={(e) => (e.target.style.display = "none")}
              />
              {/* Tłumaczenie nazwy języka np. Polski, English... */}
              {t(`languages.${code}`)}
            </button>
          ))}
        </div>
      </div>

      <h3 className="section-title">
        {t("projects.contentForm.header")} ({activeLangTab.toUpperCase()})
      </h3>

      <div className="form-field">
        <label>{t("projects.fields.title")}</label>
        <input
          type="text"
          value={formData.title[activeLangTab] || ""}
          onChange={(e) => onLangChange("title", e.target.value)}
          // Placeholder: "Wpisz tytuł (pl)..."
          placeholder={`${t(
            "projects.placeholders.enterTitle"
          )} (${activeLangTab})...`}
        />
      </div>

      <div className="form-field">
        <label>{t("projects.fields.detailedDescription")}</label>
        <textarea
          rows={10}
          value={formData.description[activeLangTab] || ""}
          onChange={(e) => onLangChange("description", e.target.value)}
          // Placeholder: "Opisz zbiórkę (pl)..."
          placeholder={`${t(
            "projects.placeholders.enterDescription"
          )} (${activeLangTab})...`}
        />
      </div>

      <div className="form-row">
        <div className="form-field half">
          <label>{t("projects.fields.country")}</label>
          <input
            type="text"
            value={formData.country[activeLangTab] || ""}
            onChange={(e) => onLangChange("country", e.target.value)}
          />
        </div>
        <div className="form-field half">
          <label>{t("projects.fields.age")}</label>
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
