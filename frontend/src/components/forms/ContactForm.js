import React, { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import Button from "../ui/Button";
import Checkbox from "../ui/Checkbox";
import Loader from "../ui/Loader"; // <--- 1. Importujemy Twój Loader
import api from "../../utils/api";

const initialForm = {
  fullName: "",
  email: "",
  message: "",
  consentPrivacy: false,
};

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 1500;

function ContactForm({ onShowAlert }) {
  const { t, i18n } = useTranslation("contact");

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Stan ładowania

  const currentLang = (i18n.language || "pl").split("-")[0];

  const getPrivacyLink = () => {
    switch (currentLang) {
      case "en":
        return "/docs/policy.pdf";
      case "es":
        return "/docs/politica.pdf";
      case "pl":
      default:
        return "/docs/polityka.pdf";
    }
  };

  const validateField = (name, value) => {
    const trimmed = typeof value === "string" ? value.trim() : value;

    switch (name) {
      case "fullName":
        if (!trimmed) return t("form.errors.fullName.required");
        if (trimmed.length < 3) return t("form.errors.fullName.min");
        if (trimmed.length > MAX_NAME_LENGTH)
          return t("form.errors.fullName.max", { max: MAX_NAME_LENGTH });
        return "";
      case "email":
        if (!trimmed) return t("form.errors.email.required");
        if (trimmed.length < 5) return t("form.errors.email.min");
        if (trimmed.length > MAX_EMAIL_LENGTH)
          return t("form.errors.email.max", { max: MAX_EMAIL_LENGTH });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) return t("form.errors.email.format");
        return "";
      case "message":
        if (!trimmed) return t("form.errors.message.required");
        if (trimmed.length < 10) return t("form.errors.message.min");
        if (trimmed.length > MAX_MESSAGE_LENGTH)
          return t("form.errors.message.max", { max: MAX_MESSAGE_LENGTH });
        return "";
      case "consentPrivacy":
        if (!value) return t("form.errors.consentPrivacy.required");
        return "";
      default:
        return "";
    }
  };

  const validateForm = (values) => {
    const newErrors = {};
    Object.keys(values).forEach((field) => {
      const msg = validateField(field, values[field]);
      if (msg) newErrors[field] = msg;
    });
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;

    if (type !== "checkbox") {
      if (name === "fullName" && newValue.length > MAX_NAME_LENGTH)
        newValue = newValue.slice(0, MAX_NAME_LENGTH);
      if (name === "email" && newValue.length > MAX_EMAIL_LENGTH)
        newValue = newValue.slice(0, MAX_EMAIL_LENGTH);
      if (name === "message" && newValue.length > MAX_MESSAGE_LENGTH)
        newValue = newValue.slice(0, MAX_MESSAGE_LENGTH);
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));

    if (hasSubmitted) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, newValue),
      }));
    }
  };

  const handleCheckboxChange = (newVal) => {
    setForm((prev) => ({ ...prev, consentPrivacy: newVal }));
    if (hasSubmitted) {
      setErrors((prev) => ({
        ...prev,
        consentPrivacy: validateField("consentPrivacy", newVal),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Wywołujemy Alert z ContactPage (rodzica)
      onShowAlert?.({
        variant: "error",
        message: t("form.alerts.validation"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: form.fullName,
        email: form.email,
        phone: "",
        subject: "Message from Website Form",
        message: form.message,
        consent: form.consentPrivacy,
      };

      await api.post("/contact", payload);

      // Sukces: Wywołujemy Twój Alert (zielony)
      onShowAlert?.({
        variant: "success",
        message: t("form.alerts.success"),
      });

      setForm(initialForm);
      setHasSubmitted(false);
      setErrors({});
    } catch (error) {
      console.error("Contact form error:", error);
      // Błąd: Wywołujemy Twój Alert (czerwony)
      onShowAlert?.({
        variant: "error",
        message: t("form.alerts.error") || "Failed to send message.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getError = (field) => (hasSubmitted ? errors[field] : "");

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {/* ... (pola input bez zmian) ... */}
      <div className={`form-field ${getError("fullName") ? "is-error" : ""}`}>
        <label htmlFor="fullName">{t("form.fields.fullName.label")}</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          value={form.fullName}
          onChange={handleChange}
          placeholder={t("form.fields.fullName.placeholder")}
          maxLength={MAX_NAME_LENGTH}
          required
          disabled={isSubmitting}
        />
        <p className="field-error">{getError("fullName") || "\u00A0"}</p>
      </div>

      <div className={`form-field ${getError("email") ? "is-error" : ""}`}>
        <label htmlFor="email">{t("form.fields.email.label")}</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder={t("form.fields.email.placeholder")}
          maxLength={MAX_EMAIL_LENGTH}
          required
          disabled={isSubmitting}
        />
        <p className="field-error">{getError("email") || "\u00A0"}</p>
      </div>

      <div className={`form-field ${getError("message") ? "is-error" : ""}`}>
        <label htmlFor="message">{t("form.fields.message.label")}</label>
        <textarea
          id="message"
          name="message"
          rows="5"
          value={form.message}
          onChange={handleChange}
          placeholder={t("form.fields.message.placeholder")}
          maxLength={MAX_MESSAGE_LENGTH}
          required
          disabled={isSubmitting}
        />
        <p className="field-error">{getError("message") || "\u00A0"}</p>
      </div>

      <div
        className={`form-field checkbox-field ${
          getError("consentPrivacy") ? "is-error" : ""
        }`}
      >
        <Checkbox
          name="consentPrivacy"
          checked={form.consentPrivacy}
          onChange={handleCheckboxChange}
          disabled={isSubmitting}
        >
          <Trans
            i18nKey="form.fields.consentPrivacy.label"
            ns="contact"
            components={[
              <a
                key="privacy-link"
                href={getPrivacyLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                x
              </a>,
            ]}
          />
        </Checkbox>
        <p className="field-error">{getError("consentPrivacy") || "\u00A0"}</p>
      </div>

      <div className="form-actions">
        {/* --- 2. Użycie Loadera wewnątrz przycisku --- */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            // Wyświetlamy Twój Loader (mały, inline) zamiast tekstu
            <Loader size="sm" variant="inline" />
          ) : (
            t("form.submit")
          )}
        </Button>
      </div>
    </form>
  );
}

export default ContactForm;
