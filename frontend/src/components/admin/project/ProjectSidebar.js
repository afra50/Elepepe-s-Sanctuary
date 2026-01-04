import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";
import DatePickerField from "../../ui/DatePickerField";
import Select from "../../ui/Select"; // <--- Import Twojego Selecta

const ProjectSidebar = ({
  formData,
  onChange,
  onLangChange,
  activeLang,
  onViewRequest,
}) => {
  const { t } = useTranslation("admin");

  const deadlineValue = formData.deadline || "";

  // Helper do zmiany wartości z Selecta (Select zwraca samą wartość, nie event)
  const handleSelectChange = (name, val) => {
    onChange({ target: { name, value: val } });
  };

  const handleDateChange = (val) => {
    onChange({ target: { name: "deadline", value: val } });
  };

  const handleCheckboxChange = (checked) => {
    onChange({
      target: { name: "isUrgent", type: "checkbox", checked: checked },
    });
  };

  // --- OPCJE DLA SELECTÓW ---

  const statusOptions = [
    { value: "draft", label: t("projects.fields.statusOptions.draft") },
    { value: "active", label: t("projects.fields.statusOptions.active") },
    { value: "completed", label: t("projects.fields.statusOptions.completed") },
    { value: "cancelled", label: t("projects.fields.statusOptions.cancelled") },
  ];

  const speciesOptions = [
    { value: "rat", label: t("form.fields.species.options.rat") },
    { value: "guineaPig", label: t("form.fields.species.options.guineaPig") },
    { value: "other", label: t("form.fields.species.options.other") },
  ];

  const applicantTypeOptions = [
    { value: "person", label: t("form.fields.applicantType.options.person") },
    {
      value: "organization",
      label: t("form.fields.applicantType.options.organization"),
    },
    {
      value: "vetClinic",
      label: t("form.fields.applicantType.options.vetClinic"),
    },
  ];

  return (
    <>
      {/* --- KARTA 1: KONFIGURACJA --- */}
      <div className="card sidebar-card">
        <h3 className="section-title">
          {t("projects.sections.configuration")}
        </h3>

        <div className="form-field">
          <label>{t("projects.fields.status")}</label>
          {/* Użycie Twojego Selecta */}
          <Select
            options={statusOptions}
            value={formData.status}
            onChange={(val) => handleSelectChange("status", val)}
          />
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
              {/* Użycie Twojego Selecta */}
              <Select
                options={speciesOptions}
                value={formData.species}
                onChange={(val) => handleSelectChange("species", val)}
              />
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
            {/* Użycie Twojego Selecta */}
            <Select
              options={applicantTypeOptions}
              value={formData.applicantType}
              onChange={(val) => handleSelectChange("applicantType", val)}
            />
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
