import React from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  PawPrint,
  Coins,
  User,
  Building2,
  Stethoscope,
  MapPin,
} from "lucide-react";

// Pomocniczy komponent flagi (lokalnie w tym pliku)
const LanguageFlag = ({ langCode }) => {
  const code = langCode ? langCode.toLowerCase() : "en";
  return (
    <img
      src={`/flags/${code}.svg`}
      alt={code}
      className="flag-icon"
      onError={(e) => {
        e.target.src = "/flags/en.svg";
      }}
    />
  );
};

// Pomocnicza funkcja do ikon
const getApplicantIcon = (type) => {
  switch (type) {
    case "organization":
      return <Building2 size={18} />;
    case "vetClinic":
      return <Stethoscope size={18} />;
    default:
      return <User size={18} />;
  }
};

const RequestCard = ({ req, onClick }) => {
  const { t } = useTranslation("admin");

  return (
    <article className="request-card clickable" onClick={onClick}>
      {/* --- GÓRA KARTY --- */}
      <div className="card-top">
        <div className={`applicant-badge ${req.applicantType}`}>
          {getApplicantIcon(req.applicantType)}
          <span>
            {t(`form.fields.applicantType.options.${req.applicantType}`) ||
              req.applicantType}
          </span>
        </div>
        <div className="lang-flag" title={`Język: ${req.submissionLanguage}`}>
          <LanguageFlag langCode={req.submissionLanguage} />
        </div>
      </div>

      {/* --- ŚRODEK KARTY --- */}
      <div className="card-body">
        <h3 className="applicant-name">{req.fullName}</h3>

        <div className="meta-row">
          <span className="country-info">
            <MapPin size={14} />
            {req.country || t("requests.unknownCountry") || "Nieznany kraj"}
          </span>
          <span className="date-info">
            {t("requests.sentDate") || "Wysłano"}: {req.createdAt}
          </span>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <span className="label">
              <Coins size={14} /> {t("form.fields.amount.label") || "Kwota"}
            </span>
            <span className="value money">
              {req.amount} {req.currency}
            </span>
          </div>

          <div className="info-item">
            <span className="label">
              <Calendar size={14} />{" "}
              {t("form.fields.deadline.label") || "Termin"}
            </span>
            <span className="value">{req.deadline}</span>
          </div>

          <div className="info-item full-width">
            <span className="label">
              <PawPrint size={14} /> {t("form.sections.animal") || "Zwierzak"}
            </span>
            <span className="value">
              {t(`form.fields.species.options.${req.species}`) || req.species}
              {req.animalsCount > 1 && ` (x${req.animalsCount})`}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default RequestCard;
