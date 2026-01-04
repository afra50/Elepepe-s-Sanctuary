import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ContactForm from "../components/forms/ContactForm";
import Alert from "../components/ui/Alert";

function ContactPage() {
  const { t } = useTranslation("contact");
  const [alert, setAlert] = useState(null);

  const handleShowAlert = (payload) => {
    if (!payload) return;
    setAlert(payload);
  };

  return (
    <main className="page-contact">
      {alert && (
        <Alert
          variant={alert.variant}
          onClose={() => setAlert(null)}
          autoClose={alert.autoClose ?? 5000}
        >
          {alert.message}
        </Alert>
      )}

      <div className="container">
        {/* Nagłówek strony */}
        <header className="page-header">
          <h1>{t("title")}</h1>
          <p className="page-intro">{t("intro")}</p>
        </header>

        {/* Dwie kolumny: info + formularz */}
        <section className="contact-layout">
          {/* Lewa kolumna – dane kontaktowe + fundacja */}
          <div className="contact-column contact-column--info">
            <h2>{t("sections.contactInfo.title")}</h2>

            <div className="contact-info">
              <p>
                <strong>{t("sections.contactInfo.labels.phoneMain")}</strong>
                <br />
                +48 533 162 318
              </p>

              <p>
                <strong>
                  {t("sections.contactInfo.labels.phoneSecondary")}
                </strong>
                <br />
                +34 644 34 88 73
              </p>

              <p>
                <strong>{t("sections.contactInfo.labels.email")}</strong>
                <br />
                contact@elepepes-sanctuary.org
              </p>
            </div>

            <h3>{t("sections.foundation.title")}</h3>
            <div className="foundation-info">
              <p>Elepepe&apos;s Sanctuary</p>

              <p>
                <strong>{t("sections.foundation.labels.regNumber")}</strong>{" "}
                631,974
              </p>

              <p>
                <strong>{t("sections.foundation.labels.nif")}</strong> G22905830
              </p>

              <p>
                <strong>{t("sections.foundation.labels.address")}</strong>
                <br />
                Calle Ciudad Aljarafe Nº 24, Blq 24
                <br />
                Planta 2, Puerta 8
                <br />
                41927 Mairena del Aljarafe (Sevilla)
                <br />
                España
              </p>

              <p>
                <strong>{t("sections.foundation.labels.regDate")}</strong>{" "}
                06/11/2025
              </p>
            </div>
          </div>

          {/* Prawa kolumna – formularz kontaktowy */}
          <div className="contact-column contact-column--form">
            <h2>{t("sections.form.title")}</h2>
            <p className="contact-help-text">{t("sections.form.subtitle")}</p>

            <ContactForm onShowAlert={handleShowAlert} />
          </div>
        </section>
      </div>
    </main>
  );
}
export default ContactPage;
