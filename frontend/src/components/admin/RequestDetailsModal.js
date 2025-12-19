import React from "react";
import { useTranslation } from "react-i18next";
import {
  ExternalLink,
  Check,
  Minus,
  Download,
  X,
  RotateCcw,
} from "lucide-react";

// Importy UI
import Button from "../ui/Button";
import Loader from "../ui/Loader";
import Modal from "../ui/Modal";
import ErrorState from "../ui/ErrorState";

// Utils
import { formatDate } from "../../utils/dateUtils";

// Helper lokalny (lub importowany z utils)
const getLanguageLabel = (code) => {
  const map = {
    pl: "🇵🇱 Polski",
    en: "🇬🇧 English",
    es: "🇪🇸 Español",
  };
  return map[code] || code;
};

// Komponent pomocniczy do tagów
const BooleanStatus = ({ value, label }) => (
  <span className={`status-tag ${value ? "positive" : "neutral"}`}>
    {value ? <Check size={14} /> : <Minus size={14} />}
    {label}
  </span>
);

const RequestDetailsModal = ({
  isOpen,
  onClose,
  requestRaw,
  details,
  isLoading,
  error,
  onRetry,
  // Akcje
  onApprove,
  onReject,
  onPending,
  onViewProject, // <--- 1. Dodajemy nowy prop
}) => {
  const { t, i18n } = useTranslation("admin");

  // --- STOPKA MODALA ---
  const modalFooter =
    !isLoading && !error && details ? (
      <>
        <Button variant="ghost" onClick={onClose}>
          {t("actions.close")}
        </Button>

        {/* STATUS OCZEKUJĄCY - bez zmian */}
        {details.status === "pending" && (
          <>
            <Button
              variant="accent"
              icon={<X size={18} />}
              onClick={() => onReject(details)}
            >
              {t("actions.reject")}
            </Button>
            <Button
              variant="primary"
              icon={<Check size={18} />}
              onClick={() => onApprove(details)}
            >
              {t("actions.approve")}
            </Button>
          </>
        )}

        {details.status === "approved" && (
          <Button
            variant="outline"
            icon={<ExternalLink size={18} />}
            onClick={() => {
              // Wywołaj funkcję przekazaną z rodzica (AdminRequests.js)
              if (onViewProject) {
                onViewProject(details);
              }
            }}
          >
            {/* Zmień tekst jeśli chcesz, np. "Edytuj zbiórkę" */}
            {t("actions.viewProject") || "Zobacz zrzutkę"}
          </Button>
        )}

        {/* STATUS ODRZUCONY - bez zmian (chyba że też chcesz zablokować) */}
        {details.status === "rejected" && (
          <>
            <Button
              variant="secondary"
              icon={<RotateCcw size={18} />}
              onClick={() => onPending(details)}
            >
              {t("status.pending")}
            </Button>
            <Button
              variant="primary"
              icon={<Check size={18} />}
              onClick={() => onApprove(details)}
            >
              {t("actions.approve")}
            </Button>
          </>
        )}
      </>
    ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        requestRaw
          ? `${t("requests.detailsTitle")} #${requestRaw.id}`
          : t("requests.detailsTitle")
      }
      size="lg"
      footer={modalFooter}
    >
      {isLoading ? (
        <Loader size="md" variant="center" />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : details ? (
        <div className="request-details-view">
          {/* SEKCJA 1: WNIOSKODAWCY */}
          <section>
            <h3 className="detail-header">
              {t("requests.sections.applicantData")}
            </h3>
            <div className="detail-grid">
              <div className="info-group">
                <span className="info-label">
                  {t("form.fields.applicantType.label")}
                </span>
                <span className="info-value">
                  {t(
                    `form.fields.applicantType.options.${details.applicantType}`
                  )}
                </span>
              </div>
              <div className="info-group">
                <span className="info-label">{t("form.fields.fullName")}</span>
                <span className="info-value fw-bold">{details.fullName}</span>
              </div>
              <div className="info-group">
                <span className="info-label">{t("form.fields.contact")}</span>
                <div className="info-value">
                  <a href={`mailto:${details.email}`} className="link">
                    {details.email}
                  </a>
                  <br />
                  <a href={`tel:${details.phone}`} className="link">
                    {details.phone}
                  </a>
                </div>
              </div>
              <div className="info-group">
                <span className="info-label">{t("form.fields.location")}</span>
                <span className="info-value">
                  {details.city}, {details.country}
                </span>
              </div>
              <div className="info-group">
                <span className="info-label">{t("form.fields.sentDate")}</span>
                <span className="info-value">
                  {formatDate(details.createdAt, i18n.language)}
                </span>
              </div>
              <div className="info-group">
                <span className="info-label">
                  {t("form.fields.submissionLanguage")}
                </span>
                <span className="info-value">
                  {getLanguageLabel(details.submissionLanguage)}
                </span>
              </div>
            </div>
          </section>

          <hr className="detail-divider" />

          {/* SEKCJA 2: O ZWIERZAKU */}
          <section>
            <h3 className="detail-header">
              {t("requests.sections.requestDetails")}
            </h3>
            <div className="detail-grid">
              <div className="info-group">
                <span className="info-label">
                  {t("form.fields.animalName")}
                </span>
                <span className="info-value">
                  <strong>{details.animalName}</strong>
                  <span
                    className="text-muted"
                    style={{
                      fontWeight: 400,
                      display: "block",
                      marginTop: 4,
                    }}
                  >
                    {t(`form.fields.species.options.${details.species}`)}
                    {details.species === "other" &&
                      ` (${details.speciesOther})`}
                    , {details.age || "-"} {t("common.years")}
                  </span>
                </span>
              </div>
              <div className="info-group">
                <span className="info-label">
                  {t("form.fields.animalsCount")}
                </span>
                <span className="info-value">{details.animalsCount}</span>
              </div>
              <div className="info-group highlight-box">
                <span className="info-label">{t("form.fields.amount")}</span>
                <span className="info-value money-display">
                  {details.amount} {details.currency}
                </span>
                <span className="info-sub text-muted">
                  {t(`form.fields.amountType.options.${details.amountType}`) ||
                    details.amountType}
                </span>
              </div>
              <div className="info-group">
                <span className="info-label">{t("form.fields.deadline")}</span>
                <span className="info-value date-badge">
                  {formatDate(details.deadline, i18n.language)}
                </span>
              </div>
            </div>

            <div className="info-group full-width mt-4">
              <span className="info-label">{t("form.fields.description")}</span>
              <div className="info-value text-block">{details.description}</div>
            </div>

            {details.otherHelp && (
              <div className="info-group full-width mt-4">
                <span className="info-label">{t("form.fields.otherHelp")}</span>
                <div className="info-value text-block">{details.otherHelp}</div>
              </div>
            )}

            <div className="tags-container mt-3">
              <BooleanStatus
                value={details.treatmentOngoing}
                label={t("form.fields.treatmentOngoing")}
              />
              <BooleanStatus
                value={details.needsInstallments}
                label={t("form.fields.needsInstallments")}
              />
            </div>

            {details.otherFundraiserLink && (
              <div className="info-group mt-3">
                <span className="info-label">
                  {t("form.fields.otherFundraiserLink")}
                </span>
                <a
                  href={details.otherFundraiserLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-link"
                >
                  {t("actions.openLink")} <ExternalLink size={14} />
                </a>
              </div>
            )}
          </section>

          <hr className="detail-divider" />

          {/* SEKCJA 3: PLIKI */}
          <section>
            <h3 className="detail-header">
              {t("requests.sections.attachments")}
            </h3>

            {!details.petPhotos?.length && !details.documents?.length && (
              <p className="text-muted">{t("requests.noAttachments")}</p>
            )}

            {details.petPhotos?.length > 0 && (
              <div className="mb-3">
                <span className="info-label d-block mb-2">
                  {t("form.fields.photos")} ({details.petPhotos.length})
                </span>
                <div className="file-previews">
                  {details.petPhotos.map((photo) => (
                    <div key={photo.id} className="file-preview">
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img src={photo.url} alt={photo.originalName} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {details.documents?.length > 0 && (
              <div className="info-group">
                <span className="info-label d-block mb-2">
                  {t("form.fields.documents")} ({details.documents.length})
                </span>
                <div className="file-list-container">
                  {details.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="simple-file-link"
                    >
                      <Download size={14} /> {doc.originalName}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          <hr className="detail-divider" />

          {/* SEKCJA 4: WYPŁATA */}
          <details className="payout-details-group">
            <summary>{t("requests.sections.payoutData")}</summary>
            <div className="detail-grid">
              <div className="info-group">
                <span className="info-label">
                  {t("form.fields.payoutName")}
                </span>
                <span className="info-value">{details.payoutName}</span>
              </div>
              <div className="info-group">
                <span className="info-label">{t("form.fields.bankName")}</span>
                <span className="info-value">
                  {details.payoutBankName} ({details.payoutBankCountry})
                </span>
              </div>
              <div className="info-group full-width">
                <span className="info-label">{t("form.fields.iban")}</span>
                <span className="info-value font-mono">
                  {details.payoutIban}
                </span>
              </div>
              <div className="info-group">
                <span className="info-label">{t("form.fields.swift")}</span>
                <span className="info-value font-mono">
                  {details.payoutSwift}
                </span>
              </div>
              <div className="info-group full-width">
                <span className="info-label">{t("form.fields.address")}</span>
                <span className="info-value">{details.payoutAddress}</span>
              </div>
            </div>
          </details>
        </div>
      ) : null}
    </Modal>
  );
};

export default RequestDetailsModal;
