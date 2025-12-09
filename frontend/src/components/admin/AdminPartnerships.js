import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import { Edit2, Trash2, Plus } from "lucide-react";
import { partnersApi, FILES_BASE_URL } from "../../utils/api";

const AdminPartnerships = () => {
  const { t } = useTranslation("admin");

  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- POBRANIE LISTY PARTNERÓW Z BACKENDU ---
  useEffect(() => {
    const fetchPartners = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await partnersApi.getAll();
        const data = response.data || [];

        // mapujemy z pól z bazy na to, czego używa UI (na razie PL;
        // później możesz przełączyć na EN/ES w zależności od języka admina)
        const mapped = data.map((p) => ({
          id: p.id,
          name: p.namePl || p.nameEn || p.nameEs || "",
          shortDescription:
            p.descriptionPl || p.descriptionEn || p.descriptionEs || "",
          country: p.countryPl || p.countryEn || p.countryEs || "",
          logoUrl: p.logoPath ? `${FILES_BASE_URL}${p.logoPath}` : null,
        }));

        setPartners(mapped);
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
    // 🔜 tu podepniesz modal z formularzem (PL/EN/ES)
    console.log("Open add-partner modal");
  };

  const handleEdit = (partner) => {
    // 🔜 modal / edycja partnera
    console.log("Edit partner", partner);
  };

  const handleDelete = async (id) => {
    const confirmText =
      t("partnerships.confirmDelete") ||
      "Czy na pewno chcesz usunąć tego partnera?";

    if (!window.confirm(confirmText)) return;

    try {
      await partnersApi.delete(id);
      setPartners((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete partner:", err);
      alert(
        t("partnerships.deleteError") ||
          "Nie udało się usunąć partnera. Spróbuj ponownie."
      );
    }
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
          <p>{t("partnerships.empty")}</p>
        </div>
      ) : (
        <div className="partners-grid">
          {partners.map((partner) => (
            <article key={partner.id} className="partner-card">
              {/* GÓRNA CZĘŚĆ – DUŻE LOGO NA CAŁĄ SZEROKOŚĆ */}
              <div className="partner-card__logo">
                {partner.logoUrl ? (
                  <img src={partner.logoUrl} alt={partner.name} />
                ) : (
                  <span className="partner-logo__placeholder">
                    {partner.name.charAt(0)}
                  </span>
                )}
              </div>

              {/* DOLNA CZĘŚĆ – NAZWA, KRAJ, OPIS + IKONY NA DOLE */}
              <div className="partner-card__body">
                <h3 className="partner-name">{partner.name}</h3>

                <span className="partner-country-badge">{partner.country}</span>

                <p className="partner-description">
                  {partner.shortDescription}
                </p>

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
                    onClick={() => handleDelete(partner.id)}
                    aria-label={
                      t("partnerships.buttons.delete") || "Usuń partnera"
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPartnerships;
