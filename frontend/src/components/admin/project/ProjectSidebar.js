import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";
import DatePickerField from "../../ui/DatePickerField";

const ProjectSidebar = ({
  formData,
  onChange,
  onLangChange,
  activeLang,
  onViewRequest,
}) => {
  const { t } = useTranslation("admin");

  const deadlineValue = formData.deadline || "";

  const handleDateChange = (val) => {
    onChange({ target: { name: "deadline", value: val } });
  };

  const handleCheckboxChange = (checked) => {
    onChange({
      target: { name: "isUrgent", type: "checkbox", checked: checked },
    });
  };

  return (
    <>
      {/* --- KARTA 1: KONFIGURACJA --- */}
      <div className="card sidebar-card">
        <h3 className="section-title">
          {t("projects.sections.configuration")}
        </h3>

        <div className="form-field">
          <label>{t("projects.fields.status")}</label>
          <select name="status" value={formData.status} onChange={onChange}>
            <option value="draft">
              {t("projects.fields.statusOptions.draft")}
            </option>
            <option value="active">
              {t("projects.fields.statusOptions.active")}
            </option>
            <option value="completed">
              {t("projects.fields.statusOptions.completed")}
            </option>
            <option value="cancelled">
              {t("projects.fields.statusOptions.cancelled")}
            </option>
          </select>
        </div>

        {/* --- STYLIZOWANY CHECKBOX PILNE --- */}
        <div className="form-field urgent-field-box">
          <Checkbox
            name="isUrgent"
            checked={formData.isUrgent}
            onChange={handleCheckboxChange}
          >
            <div className="urgent-label-content">
              <AlertTriangle size={16} strokeWidth={2.5} />
              <span>{t("projects.fields.isUrgent")}</span>
            </div>
          </Checkbox>
        </div>

        <div className="form-field">
          <label>{t("projects.fields.slug")}</label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={onChange}
          />
        </div>

        <div className="form-field">
          <label>{t("projects.fields.deadline")}</label>
          <DatePickerField
            name="deadline"
            value={deadlineValue}
            onChange={handleDateChange}
            placeholder={t("common.selectDate")}
          />
        </div>
      </div>

      {/* --- KARTA 2: DANE ZWIERZAKA --- */}
      <div className="card sidebar-card mt-4">
        <h3 className="section-title">{t("projects.sidebar.animalData")}</h3>

        <div className="info-list">
          <div className="form-field">
            <label>{t("projects.fields.animalName")}</label>
            <input
              type="text"
              name="animalName"
              value={formData.animalName}
              onChange={onChange}
            />
          </div>

          <div className="form-row form-row--sm">
            <div className="form-field half">
              <label>{t("projects.fields.species")}</label>
              <select
                name="species"
                value={formData.species}
                onChange={onChange}
              >
                {/* Używamy kluczy z sekcji 'form', które już masz w JSON */}
                <option value="rat">
                  {t("form.fields.species.options.rat")}
                </option>
                <option value="guineaPig">
                  {t("form.fields.species.options.guineaPig")}
                </option>
                <option value="other">
                  {t("form.fields.species.options.other")}
                </option>
              </select>
            </div>
            <div className="form-field half">
              <label>{t("projects.fields.animalsCount")}</label>
              <input
                type="number"
                name="animalsCount"
                value={formData.animalsCount}
                onChange={onChange}
                min="1"
              />
            </div>
          </div>

          {formData.species === "other" && (
            <div className="form-field species-other-box">
              <label>
                <img
                  src={`/flags/${activeLang}.svg`}
                  alt={activeLang}
                  className="input-flag"
                />
                {t("projects.fields.speciesOther")} - {activeLang.toUpperCase()}
              </label>
              <input
                type="text"
                value={formData.speciesOther[activeLang] || ""}
                onChange={(e) => onLangChange("speciesOther", e.target.value)}
                placeholder={`${t(
                  "projects.placeholders.speciesOther"
                )} (${activeLang})`}
              />
            </div>
          )}

          <div className="form-field">
            <label>{t("projects.fields.city")}</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={onChange}
            />
          </div>
        </div>
      </div>

      {/* --- KARTA 3: DANE WNIOSKODAWCY --- */}
      <div className="card sidebar-card mt-4 applicant-info-box">
        <h3 className="section-title">
          {t("projects.sections.applicantData")}
        </h3>

        <div className="info-list">
          <div className="form-field">
            <label>{t("form.fields.fullName")}</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={onChange}
            />
          </div>

          <div className="form-field">
            <label>{t("form.fields.applicantType.label")}</label>
            <select
              name="applicantType"
              value={formData.applicantType}
              onChange={onChange}
            >
              <option value="person">
                {t("form.fields.applicantType.options.person")}
              </option>
              <option value="organization">
                {t("form.fields.applicantType.options.organization")}
              </option>
              <option value="vetClinic">
                {t("form.fields.applicantType.options.vetClinic")}
              </option>
            </select>
          </div>

          <div className="applicant-details">
            <div className="applicant-meta mt-3">
              <span>{t("projects.sidebar.requestId")}:</span>
              <strong>#{formData.requestId}</strong>
            </div>
          </div>
        </div>

        <Button
          variant="accent"
          size="sm"
          className="w-full mt-3"
          onClick={onViewRequest}
          disabled={!formData.requestId}
        >
          {t("projects.sidebar.viewOriginalRequest")}
        </Button>
      </div>
    </>
  );
};

export default ProjectSidebar;
