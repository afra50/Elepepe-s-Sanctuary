// src/components/admin/AdminPartnerships.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import { Edit2, Trash2, Plus } from "lucide-react";
import { partnersApi, FILES_BASE_URL } from "../../utils/api";
import AdminPartnerModal from "./AdminPartnerModal";
import ConfirmDialog from "../ui/ConfirmDialog";
import Alert from "../ui/Alert";
import ErrorState from "../ui/ErrorState";
import Loader from "../ui/Loader"; // ⬅️ NOWE

const mapPartnerToUi = (p, lang) => {
  const pickByLang = (pl, en, es) => {
    switch (lang) {
      case "pl":
        return pl || en || es || "";
      case "en":
        return en || pl || es || "";
      case "es":
        return es || en || pl || "";
      default:
        return pl || en || es || "";
    }
  };

  return {
    id: p.id,
    name: pickByLang(p.namePl, p.nameEn, p.nameEs),
    shortDescription: pickByLang(
      p.descriptionPl,
      p.descriptionEn,
      p.descriptionEs
    ),
    country: pickByLang(p.countryPl, p.countryEn, p.countryEs),
    logoUrl: p.logoPath ? `${FILES_BASE_URL}${p.logoPath}` : null,
  };
};

const AdminPartnerships = () => {
  const { t, i18n } = useTranslation("admin");

  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);

  const [alertConfig, setAlertConfig] = useState(null);

  const showAlert = (variant, message) => {
    setAlertConfig({ variant, message });
  };

  // --- POBRANIE LISTY PARTNERÓW Z BACKENDU ---
  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await partnersApi.getAll();
      const data = response.data || [];
      setPartners(data);
    } catch (err) {
      console.error("Failed to fetch partners:", err);
      setError(
        t("partnerships.fetchError") || "Nie udało się pobrać listy partnerów."
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleAddPartner = () => {
    setEditingPartner(null);
    setIsModalOpen(true);
  };

  const handleEdit = (partner) => {
    setEditingPartner(partner); // pełny obiekt z backendu
    setIsModalOpen(true);
  };

  const handleDeleteClick = (partner) => {
    setPartnerToDelete(partner);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!partnerToDelete) return;

    try {
      await partnersApi.delete(partnerToDelete.id);
      setPartners((prev) => prev.filter((p) => p.id !== partnerToDelete.id));

      showAlert(
        "success",
        t("partnerships.alerts.deleteSuccess") ||
          "Partner został pomyślnie usunięty."
      );
    } catch (err) {
      console.error("Failed to delete partner:", err);

      showAlert(
        "error",
        t("partnerships.alerts.deleteError") ||
          t("partnerships.deleteError") ||
          "Nie udało się usunąć partnera. Spróbuj ponownie."
      );
    } finally {
      setIsConfirmOpen(false);
      setPartnerToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setPartnerToDelete(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
  };

  // 🔴 błędy z create/update z modala
  const handlePartnerError = (message) => {
    showAlert(
      "error",
      message ||
        t("partnerships.alerts.saveError") ||
        "Nie udało się zapisać partnera. Spróbuj ponownie."
    );
  };

  // partnerFromApi – pełny obiekt z modala, isEdit – czy to była edycja
  const handlePartnerSaved = (partnerFromApi, isEdit) => {
    setPartners((prev) => {
      const without = prev.filter((p) => p.id !== partnerFromApi.id);

      return [
        {
          ...partnerFromApi,
          logoPath: partnerFromApi.logoPath || "",
        },
        ...without,
      ];
    });

    if (isEdit) {
      showAlert(
        "success",
        t("partnerships.alerts.updateSuccess") ||
          "Dane partnera zostały zaktualizowane."
      );
    } else {
      showAlert(
        "success",
        t("partnerships.alerts.createSuccess") || "Nowy partner został dodany."
      );
    }

    handleModalClose();
  };

  const confirmMessage =
    partnerToDelete &&
    (partnerToDelete.namePl || partnerToDelete.nameEn || partnerToDelete.nameEs)
      ? t("partnerships.confirmDeleteNamed", {
          name:
            partnerToDelete.namePl ||
            partnerToDelete.nameEn ||
            partnerToDelete.nameEs,
        })
      : t("partnerships.confirmDelete") ||
        "Czy na pewno chcesz usunąć tego partnera?";

  // Dane do modala przy edycji: pełne pola + pełny URL logo
  const modalInitialData =
    editingPartner != null
      ? {
          ...editingPartner,
          logoPathRelative: editingPartner.logoPath || null,
          logoPath: editingPartner.logoPath
            ? `${FILES_BASE_URL}${editingPartner.logoPath}`
            : "",
        }
      : null;

  return (
    <div className="admin-partnerships-page">
      {/* ALERT (globalny na tej podstronie) */}
      {alertConfig && (
        <Alert
          variant={alertConfig.variant}
          autoClose={4000}
          onClose={() => setAlertConfig(null)}
        >
          {alertConfig.message}
        </Alert>
      )}

      {/* NAGŁÓWEK STRONY */}
      <header className="page-header">
        <div>
          <h1 className="page-title">
            {t("menu.partnerships") || "Partnerzy"}
          </h1>
          <p className="page-subtitle">
            {t("partnerships.subtitle") ||
              "Zarządzaj partnerami, których logotypy i opisy pojawią się na stronie."}
          </p>
        </div>

        <div className="actions-bar">
          <Button
            variant="accent"
            size="sm"
            onClick={handleAddPartner}
            icon={<Plus size={16} />}
          >
            {t("partnerships.buttons.addNew") || "Dodaj partnera"}
          </Button>
        </div>
      </header>

      {/* GÓRNY WIERSZ: tytuł + licznik */}
      <div className="partners-top-row">
        <h2 className="section-heading">
          {t("partnerships.current") || "Aktualni partnerzy"}
        </h2>
        <span className="partners-count-badge">
          {partners.length} {t("partnerships.countLabel") || "partnerów"}
        </span>
      </div>

      {/* STANY ŁADOWANIA / BŁĘDU / PUSTA LISTA / LISTA */}
      {isLoading ? (
        <div className="partners-loading">
          <Loader variant="center" size="md" />
          <p className="partners-loading__text">
            {t("partnerships.loading") || "Ładowanie partnerów..."}
          </p>
        </div>
      ) : error ? (
        <div className="partners-empty">
          <ErrorState
            title={
              t("partnerships.fetchErrorTitle") ||
              "Coś poszło nie tak przy ładowaniu partnerów"
            }
            message={error}
            onRetry={fetchPartners}
          />
        </div>
      ) : partners.length === 0 ? (
        <div className="partners-empty">
          <p>
            {t("partnerships.empty") ||
              "Nie dodano jeszcze żadnych partnerów. Kliknij „Dodaj partnera”, aby dodać pierwszego."}
          </p>
        </div>
      ) : (
        <div className="partners-grid">
          {partners.map((partner) => {
            const ui = mapPartnerToUi(partner, i18n.language);
            return (
              <article key={partner.id} className="partner-card">
                <div className="partner-card__logo">
                  {ui.logoUrl ? (
                    <img src={ui.logoUrl} alt={ui.name} />
                  ) : (
                    <span className="partner-logo__placeholder">
                      {ui.name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>

                <div className="partner-card__body">
                  <h3 className="partner-name">{ui.name}</h3>

                  <span className="partner-country-badge">{ui.country}</span>

                  <p className="partner-description">{ui.shortDescription}</p>

                  <div className="partner-card__actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleEdit(partner)}
                      aria-label={
                        t("partnerships.buttons.edit") || "Edytuj partnera"
                      }
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => handleDeleteClick(partner)}
                      aria-label={
                        t("partnerships.buttons.delete") || "Usuń partnera"
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL: dodawanie / edycja partnera */}
      <AdminPartnerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSaved={handlePartnerSaved}
        onError={handlePartnerError}
        initialData={modalInitialData}
      />

      {/* POTWIERDZENIE USUNIĘCIA */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        variant="danger"
        message={confirmMessage}
        confirmLabel={t("common.confirm") || "Usuń"}
        cancelLabel={t("common.cancel") || "Anuluj"}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default AdminPartnerships;
