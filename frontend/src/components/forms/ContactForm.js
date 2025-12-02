import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";

const initialForm = {
  fullName: "",
  email: "",
  message: "",
};

function ContactForm() {
  const { t } = useTranslation("contact");
  const [form, setForm] = useState(initialForm);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // tutaj później podłączymy backend / fetch
    console.log("Contact form data:", form);

    // ewentualny reset:
    // setForm(initialForm);
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {/* Imię i nazwisko */}
      <div className="form-field">
        <label htmlFor="fullName">{t("form.fields.fullName.label")}</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          value={form.fullName}
          onChange={handleChange}
          placeholder={t("form.fields.fullName.placeholder")}
          required
        />
      </div>

      {/* Email */}
      <div className="form-field">
        <label htmlFor="email">{t("form.fields.email.label")}</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder={t("form.fields.email.placeholder")}
          required
        />
      </div>

      {/* Wiadomość */}
      <div className="form-field">
        <label htmlFor="message">{t("form.fields.message.label")}</label>
        <textarea
          id="message"
          name="message"
          rows="5"
          value={form.message}
          onChange={handleChange}
          placeholder={t("form.fields.message.placeholder")}
          required
        />
      </div>

      <div className="form-actions">
        <Button type="submit" variant="primary" size="md">
          {t("form.submit")}
        </Button>
      </div>
    </form>
  );
}

export default ContactForm;
