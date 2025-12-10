import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import { Edit2, Trash2, Plus } from "lucide-react";
import { partnersApi, FILES_BASE_URL } from "../../utils/api";
import AdminPartnerModal from "./AdminPartnerModal";
import ConfirmDialog from "../ui/ConfirmDialog";

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

  const [partners, setPartners] = useState([]); // surowe dane z backendu
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null); // pełny obiekt z backendu

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);

  // --- POBRANIE LISTY PARTNERÓW Z BACKENDU ---
  useEffect(() => {
    const fetchPartners = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await partnersApi.getAll();
        const data = response.data || [];
        setPartners(data); // zapisujemy raw dane
      } catch (err) {
        console.error("Failed to fetch partners:", err);
        setError(
          t("partnerships.fetchError") ||
            "Nie udało się pobrać listy partnerów."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartners();
  }, [t]);

  const handleAddPartner = () => {
    setEditingPartner(null);
    setIsModalOpen(true);
  };

  const handleEdit = (partner) => {
    setEditingPartner(partner); // pełny obiekt (pl/en/es)
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
    } catch (err) {
      console.error("Failed to delete partner:", err);
      alert(
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

  // partnerFromApi – pełny obiekt z modala (z polami *_Pl/_En/_Es, logoPath itd.)
  const handlePartnerSaved = (partnerFromApi) => {
    setPartners((prev) => {
      const without = prev.filter((p) => p.id !== partnerFromApi.id);
      return [partnerFromApi, ...without];
    });

    handleModalClose();
  };

  return (
    <div className="admin-partnerships-page">
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

      {/* STANY ŁADOWANIA / BŁĘDU */}
      {isLoading ? (
        <p>{t("partnerships.loading") || "Ładowanie partnerów..."}</p>
      ) : error ? (
        <div className="partners-empty">
          <p>{error}</p>
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
                {/* GÓRNA CZĘŚĆ – DUŻE LOGO NA CAŁĄ SZEROKOŚĆ */}
                <div className="partner-card__logo">
                  {ui.logoUrl ? (
                    <img src={ui.logoUrl} alt={ui.name} />
                  ) : (
                    <span className="partner-logo__placeholder">
                      {ui.name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>

                {/* DOLNA CZĘŚĆ – NAZWA, KRAJ, OPIS + IKONY NA DOLE */}
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
                      onClick={() => handleDeleteClick(partner)} // ⬅ przekazujemy cały obiekt
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
        initialData={editingPartner || null}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        variant="danger"
        message={
          t("partnerships.confirmDelete") ||
          (partnerToDelete
            ? `Czy na pewno chcesz usunąć partnera "${
                partnerToDelete.namePl ||
                partnerToDelete.nameEn ||
                partnerToDelete.nameEs ||
                ""
              }"?`
            : "Czy na pewno chcesz usunąć tego partnera?")
        }
        confirmLabel={t("common.confirm") || "Usuń"}
        cancelLabel={t("common.cancel") || "Anuluj"}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default AdminPartnerships;
