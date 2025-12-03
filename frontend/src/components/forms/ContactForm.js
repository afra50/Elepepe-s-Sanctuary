import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";

const initialForm = {
  fullName: "",
  email: "",
  message: "",
};

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 1500;

function ContactForm({ onShowAlert }) {
  const { t } = useTranslation("contact");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const validateField = (name, value) => {
    const trimmed = value.trim();

    switch (name) {
      case "fullName": {
        if (!trimmed) {
          return t("form.errors.fullName.required");
        }
        if (trimmed.length < 3) {
          return t("form.errors.fullName.min");
        }
        if (trimmed.length > MAX_NAME_LENGTH) {
          return t("form.errors.fullName.max", { max: MAX_NAME_LENGTH });
        }
        return "";
      }

      case "email": {
        if (!trimmed) {
          return t("form.errors.email.required");
        }
        if (trimmed.length < 5) {
          return t("form.errors.email.min");
        }
        if (trimmed.length > MAX_EMAIL_LENGTH) {
          return t("form.errors.email.max", { max: MAX_EMAIL_LENGTH });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          return t("form.errors.email.format");
        }
        return "";
      }

      case "message": {
        if (!trimmed) {
          return t("form.errors.message.required");
        }
        if (trimmed.length < 10) {
          return t("form.errors.message.min");
        }
        if (trimmed.length > MAX_MESSAGE_LENGTH) {
          return t("form.errors.message.max", { max: MAX_MESSAGE_LENGTH });
        }
        return "";
      }

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
    const { name, value } = e.target;

    let limitedValue = value;
    if (name === "fullName" && value.length > MAX_NAME_LENGTH) {
      limitedValue = value.slice(0, MAX_NAME_LENGTH);
    }
    if (name === "email" && value.length > MAX_EMAIL_LENGTH) {
      limitedValue = value.slice(0, MAX_EMAIL_LENGTH);
    }
    if (name === "message" && value.length > MAX_MESSAGE_LENGTH) {
      limitedValue = value.slice(0, MAX_MESSAGE_LENGTH);
    }

    setForm((prev) => ({ ...prev, [name]: limitedValue }));

    if (hasSubmitted) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, limitedValue),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setHasSubmitted(true);

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // są błędy – pokazujemy alert o walidacji
      onShowAlert?.({
        variant: "error",
        message: t("form.alerts.validation"), // np. "Popraw zaznaczone pola."
      });
      return;
    }

    // tutaj później podłączymy backend / fetch
    console.log("Contact form data:", form);

    // success alert
    onShowAlert?.({
      variant: "success",
      message: t("form.alerts.success"), // np. "Wiadomość została wysłana."
    });

    // reset formularza
    setForm(initialForm);
    setHasSubmitted(false);
    setErrors({});
  };

  const getError = (field) => (hasSubmitted ? errors[field] : "");

  const fullNameError = getError("fullName");
  const emailError = getError("email");
  const messageError = getError("message");

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {/* Imię i nazwisko */}
      <div className={`form-field ${fullNameError ? "is-error" : ""}`}>
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
        />
        <p className="field-error">{fullNameError || "\u00A0"}</p>
      </div>

      {/* Email */}
      <div className={`form-field ${emailError ? "is-error" : ""}`}>
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
        />
        <p className="field-error">{emailError || "\u00A0"}</p>
      </div>

      {/* Wiadomość */}
      <div className={`form-field ${messageError ? "is-error" : ""}`}>
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
        />
        <p className="field-error">{messageError || "\u00A0"}</p>
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
