// src/pages/RequestSupportPage.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import RequestSupportForm from "../components/forms/RequestSupportForm";
import Alert from "../components/ui/Alert";

function RequestSupportPage() {
  const { t } = useTranslation("request");
  const [alert, setAlert] = useState(null);

  const handleShowAlert = (payload) => {
    if (!payload) return;
    setAlert(payload);
  };

  return (
    <main className="page-request-support">
      {alert && (
        <Alert
          variant={alert.variant}
          onClose={() => setAlert(null)}
          autoClose={alert.autoClose ?? 6000}
        >
          {alert.message}
        </Alert>
      )}

      <div className="rs-container">
        {/* Główny nagłówek strony */}
        <header className="rs-hero">
          <p className="rs-hero__eyebrow">{t("hero.eyebrow")}</p>
          <h1 className="rs-hero__title">{t("hero.title")}</h1>
          <p className="rs-hero__intro">{t("hero.intro")}</p>
        </header>

        {/* Karta z formularzem */}
        <section className="rs-card">
          <header className="rs-card__header">
            <h2 className="rs-card__title">{t("form.header.title")}</h2>
            <p className="rs-card__subtitle">{t("form.header.subtitle")}</p>
          </header>

          <RequestSupportForm onShowAlert={handleShowAlert} />
        </section>
      </div>
    </main>
  );
}

export default RequestSupportPage;
