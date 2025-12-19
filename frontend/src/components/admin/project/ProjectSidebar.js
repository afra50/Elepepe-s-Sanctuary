import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react"; // <-- Import ikony
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";
import DatePickerField from "../../ui/DatePickerField";

const ProjectSidebar = ({ formData, onChange, onLangChange, activeLang }) => {
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
        <h3 className="section-title">Konfiguracja</h3>

        <div className="form-field">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={onChange}>
            <option value="draft">Szkic (Niepubliczna)</option>
            <option value="active">Aktywna (Publiczna)</option>
            <option value="completed">Zakończona</option>
            <option value="cancelled">Anulowana</option>
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
              <span>Oznacz jako PILNE</span>
            </div>
          </Checkbox>
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
          <DatePickerField
            name="deadline"
            value={deadlineValue}
            onChange={handleDateChange}
            placeholder="Wybierz datę..."
          />
        </div>
      </div>

      {/* --- KARTA 2: DANE ZWIERZAKA --- */}
      <div className="card sidebar-card mt-4">
        <h3 className="section-title">Dane zwierzęcia</h3>

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

          <div className="form-row form-row--sm">
            <div className="form-field half">
              <label>Gatunek</label>
              <select
                name="species"
                value={formData.species}
                onChange={onChange}
              >
                <option value="rat">Szczur</option>
                <option value="guineaPig">Świnka</option>
                <option value="other">Inne</option>
              </select>
            </div>
            <div className="form-field half">
              <label>Liczba</label>
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
                Gatunek (Inne) - {activeLang.toUpperCase()}
              </label>
              <input
                type="text"
                value={formData.speciesOther[activeLang] || ""}
                onChange={(e) => onLangChange("speciesOther", e.target.value)}
                placeholder={`Np. Chomik (${activeLang})`}
              />
            </div>
          )}

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

      {/* --- KARTA 3: DANE WNIOSKODAWCY --- */}
      <div className="card sidebar-card mt-4 applicant-info-box">
        <h3 className="section-title">Dane Wnioskodawcy</h3>

        <div className="info-list">
          <div className="form-field">
            <label>Imię i Nazwisko / Nazwa</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={onChange}
            />
          </div>

          <div className="form-field">
            <label>Typ Wnioskodawcy</label>
            <select
              name="applicantType"
              value={formData.applicantType}
              onChange={onChange}
            >
              <option value="person">Osoba prywatna</option>
              <option value="organization">Organizacja</option>
              <option value="vetClinic">Klinika Wet.</option>
            </select>
          </div>

          <div className="applicant-details">
            <div className="applicant-meta mt-3">
              <span>Zgłoszenie ID:</span>
              <strong>#{formData.requestId}</strong>
            </div>
          </div>
        </div>

        <Button variant="accent" size="sm" className="w-full mt-3">
          Zobacz oryginał
        </Button>
      </div>
    </>
  );
};

export default ProjectSidebar;
