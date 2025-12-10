// src/components/admin/AdminPartnerModal.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { partnersApi } from "../../utils/api";

const emptyForm = {
  namePl: "",
  nameEn: "",
  nameEs: "",
  descriptionPl: "",
  descriptionEn: "",
  descriptionEs: "",
  countryPl: "",
  countryEn: "",
  countryEs: "",
};

const MAX_NAME_LEN = 100;
const MAX_DESC_LEN = 255;
const MAX_COUNTRY_LEN = 100;
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB

const AdminPartnerModal = ({
  isOpen,
  onClose,
  onSaved,
  onError, // ⬅️ NOWE
  initialData,
}) => {
  const { t } = useTranslation("admin");
  const isEdit = !!(initialData && initialData.id);

  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset / wypełnienie formularza po otwarciu
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        namePl: initialData.namePl || "",
        nameEn: initialData.nameEn || "",
        nameEs: initialData.nameEs || "",
        descriptionPl: initialData.descriptionPl || "",
        descriptionEn: initialData.descriptionEn || "",
        descriptionEs: initialData.descriptionEs || "",
        countryPl: initialData.countryPl || "",
        countryEn: initialData.countryEn || "",
        countryEs: initialData.countryEs || "",
      });

      // ⬅️ przy edycji pokazujemy logo jeśli dostaniemy pełny URL
      if (initialData.logoPath) {
        setLogoPreview(initialData.logoPath);
      } else {
        setLogoPreview("");
      }
    } else {
      setForm(emptyForm);
      setLogoPreview("");
    }

    setLogoFile(null);
    setErrors({});
    setIsSubmitting(false);
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        logo:
          t("partnerships.errors.logoType") ||
          "Logo musi być plikiem graficznym.",
      }));
      setLogoFile(null);
      setLogoPreview("");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setErrors((prev) => ({
        ...prev,
        logo:
          t("partnerships.errors.logoSize") ||
          "Logo jest za duże (maksymalnie 5 MB).",
      }));
      setLogoFile(null);
      setLogoPreview("");
      return;
    }

    setErrors((prev) => ({ ...prev, logo: null }));
    setLogoFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors = {};

    const validateRequiredText = (value, fieldKey, min, max, fallbackLabel) => {
      const trimmed = value.trim();
      if (!trimmed) {
        newErrors[fieldKey] =
          t(`partnerships.errors.${fieldKey}Required`) ||
          `${fallbackLabel} jest wymagane.`;
        return;
      }
      if (trimmed.length < min) {
        newErrors[fieldKey] =
          t(`partnerships.errors.${fieldKey}Min`, { min }) ||
          `${fallbackLabel} musi mieć co najmniej ${min} znaków.`;
      } else if (trimmed.length > max) {
        newErrors[fieldKey] =
          t(`partnerships.errors.${fieldKey}Max`, { max }) ||
          `${fallbackLabel} może mieć maksymalnie ${max} znaków.`;
      }
    };

    // PL – wymagane
    validateRequiredText(
      form.namePl,
      "namePl",
      2,
      MAX_NAME_LEN,
      t("partnerships.fields.namePl") || "Nazwa partnera (PL)"
    );
    validateRequiredText(
      form.descriptionPl,
      "descriptionPl",
      10,
      MAX_DESC_LEN,
      t("partnerships.fields.descriptionPl") || "Opis współpracy (PL)"
    );
    validateRequiredText(
      form.countryPl,
      "countryPl",
      2,
      MAX_COUNTRY_LEN,
      t("partnerships.fields.countryPl") || "Kraj (PL)"
    );

    // EN – wymagane
    validateRequiredText(
      form.nameEn,
      "nameEn",
      2,
      MAX_NAME_LEN,
      t("partnerships.fields.nameEn") || "Nazwa partnera (EN)"
    );
    validateRequiredText(
      form.descriptionEn,
      "descriptionEn",
      10,
      MAX_DESC_LEN,
      t("partnerships.fields.descriptionEn") || "Opis współpracy (EN)"
    );
    validateRequiredText(
      form.countryEn,
      "countryEn",
      2,
      MAX_COUNTRY_LEN,
      t("partnerships.fields.countryEn") || "Kraj (EN)"
    );

    // ES – wymagane
    validateRequiredText(
      form.nameEs,
      "nameEs",
      2,
      MAX_NAME_LEN,
      t("partnerships.fields.nameEs") || "Nazwa partnera (ES)"
    );
    validateRequiredText(
      form.descriptionEs,
      "descriptionEs",
      10,
      MAX_DESC_LEN,
      t("partnerships.fields.descriptionEs") || "Opis współpracy (ES)"
    );
    validateRequiredText(
      form.countryEs,
      "countryEs",
      2,
      MAX_COUNTRY_LEN,
      t("partnerships.fields.countryEs") || "Kraj (ES)"
    );

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("namePl", form.namePl.trim());
      formData.append("nameEn", form.nameEn.trim());
      formData.append("nameEs", form.nameEs.trim());

      formData.append("descriptionPl", form.descriptionPl.trim());
      formData.append("descriptionEn", form.descriptionEn.trim());
      formData.append("descriptionEs", form.descriptionEs.trim());

      formData.append("countryPl", form.countryPl.trim());
      formData.append("countryEn", form.countryEn.trim());
      formData.append("countryEs", form.countryEs.trim());

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      let response;
      if (isEdit) {
        // ✅ prawdziwa edycja
        response = await partnersApi.update(initialData.id, formData);
      } else {
        response = await partnersApi.create(formData);
      }

      const { partnerId, logoPath } = response.data;

      const fullPartner = {
        id: isEdit ? initialData.id : partnerId,
        namePl: form.namePl.trim(),
        nameEn: form.nameEn.trim(),
        nameEs: form.nameEs.trim(),
        descriptionPl: form.descriptionPl.trim(),
        descriptionEn: form.descriptionEn.trim(),
        descriptionEs: form.descriptionEs.trim(),
        countryPl: form.countryPl.trim(),
        countryEn: form.countryEn.trim(),
        countryEs: form.countryEs.trim(),
        logoPath:
          logoPath !== undefined
            ? logoPath
            : initialData?.logoPathRelative || null,
      };

      onSaved?.(fullPartner, isEdit);
    } catch (err) {
      console.error("Failed to save partner:", err);

      // 🔴 obsługa błędów z backendu
      let msg;

      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 400) {
        // walidacja z Joi
        msg =
          t("partnerships.alerts.validationError") ||
          "Formularz partnera zawiera błędy. Sprawdź pola i spróbuj ponownie.";
      } else {
        msg =
          t("partnerships.alerts.saveError") ||
          "Nie udało się zapisać partnera. Spróbuj ponownie.";
      }

      onError?.(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isEdit
    ? t("partnerships.modal.editTitle") || "Edytuj partnera"
    : t("partnerships.modal.addTitle") || "Dodaj nowego partnera";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t("actions.close") || t("common.cancel") || "Anuluj"}
          </Button>
          <Button
            type="submit"
            form="partner-form"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("partnerships.buttons.saving") || "Zapisywanie..."
              : t("partnerships.buttons.save") || "Zapisz partnera"}
          </Button>
        </>
      }
    >
      <form id="partner-form" onSubmit={handleSubmit} noValidate>
        {/* BLOK: POLSKI */}
        <h3 className="partner-section-header">Polski</h3>

        <div className={`form-field ${errors.namePl ? "is-error" : ""}`.trim()}>
          <label htmlFor="partner-name-pl">
            {t("partnerships.fields.namePl") || "Nazwa partnera (PL)"}
          </label>
          <input
            id="partner-name-pl"
            name="namePl"
            type="text"
            maxLength={MAX_NAME_LEN}
            value={form.namePl}
            onChange={handleChange}
            placeholder={
              t("partnerships.placeholders.namePl") || "Np. Fundacja Ogonki"
            }
          />
          <p className="field-error">{errors.namePl || "\u00A0"}</p>
        </div>

        <div
          className={`form-field ${
            errors.descriptionPl ? "is-error" : ""
          }`.trim()}
        >
          <label htmlFor="partner-description-pl">
            {t("partnerships.fields.descriptionPl") ||
              "Krótki opis współpracy (PL)"}
          </label>
          <textarea
            id="partner-description-pl"
            name="descriptionPl"
            rows="3"
            maxLength={MAX_DESC_LEN}
            value={form.descriptionPl}
            onChange={handleChange}
            placeholder={
              t("partnerships.placeholders.descriptionPl") ||
              "Np. Finansuje operacje ratujące życie naszych podopiecznych."
            }
          />
          <p className="field-error">{errors.descriptionPl || "\u00A0"}</p>
        </div>

        <div
          className={`form-field ${errors.countryPl ? "is-error" : ""}`.trim()}
        >
          <label htmlFor="partner-country-pl">
            {t("partnerships.fields.countryPl") || "Kraj (PL)"}
          </label>
          <input
            id="partner-country-pl"
            name="countryPl"
            type="text"
            maxLength={MAX_COUNTRY_LEN}
            value={form.countryPl}
            onChange={handleChange}
            placeholder={
              t("partnerships.placeholders.countryPl") || "Np. Polska"
            }
          />
          <p className="field-error">{errors.countryPl || "\u00A0"}</p>
        </div>

        <hr className="partner-section-divider" />

        {/* BLOK: ENGLISH */}
        <h3 className="partner-section-header">English</h3>

        <div className={`form-field ${errors.nameEn ? "is-error" : ""}`.trim()}>
          <label htmlFor="partner-name-en">
            {t("partnerships.fields.nameEn") || "Partner name (EN)"}
          </label>
          <input
            id="partner-name-en"
            name="nameEn"
            type="text"
            maxLength={MAX_NAME_LEN}
            value={form.nameEn}
            onChange={handleChange}
            placeholder={
              t("partnerships.placeholders.nameEn") || "e.g. Rat Rescue Europe"
            }
          />
          <p className="field-error">{errors.nameEn || "\u00A0"}</p>
        </div>

        <div
          className={`form-field ${
            errors.descriptionEn ? "is-error" : ""
          }`.trim()}
        >
          <label htmlFor="partner-description-en">
            {t("partnerships.fields.descriptionEn") || "Short description (EN)"}
          </label>
          <textarea
            id="partner-description-en"
            name="descriptionEn"
            rows="3"
            maxLength={MAX_DESC_LEN}
            value={form.descriptionEn}
            onChange={handleChange}
            placeholder={t("partnerships.placeholders.descriptionEn")}
          />
          <p className="field-error">{errors.descriptionEn || "\u00A0"}</p>
        </div>

        <div
          className={`form-field ${errors.countryEn ? "is-error" : ""}`.trim()}
        >
          <label htmlFor="partner-country-en">
            {t("partnerships.fields.countryEn") || "Country (EN)"}
          </label>
          <input
            id="partner-country-en"
            name="countryEn"
            type="text"
            maxLength={MAX_COUNTRY_LEN}
            value={form.countryEn}
            onChange={handleChange}
            placeholder={
              t("partnerships.placeholders.countryEn") || "e.g. Germany"
            }
          />
          <p className="field-error">{errors.countryEn || "\u00A0"}</p>
        </div>

        <hr className="partner-section-divider" />

        {/* BLOK: ESPAÑOL */}
        <h3 className="partner-section-header">Español</h3>

        <div className={`form-field ${errors.nameEs ? "is-error" : ""}`.trim()}>
          <label htmlFor="partner-name-es">
            {t("partnerships.fields.nameEs") || "Nombre del socio (ES)"}
          </label>
          <input
            id="partner-name-es"
            name="nameEs"
            type="text"
            maxLength={MAX_NAME_LEN}
            value={form.nameEs}
            onChange={handleChange}
            placeholder={
              t("partnerships.placeholders.nameEs") ||
              "p.ej. Clinica Veterinaria Amigos"
            }
          />
          <p className="field-error">{errors.nameEs || "\u00A0"}</p>
        </div>

        <div
          className={`form-field ${
            errors.descriptionEs ? "is-error" : ""
          }`.trim()}
        >
          <label htmlFor="partner-description-es">
            {t("partnerships.fields.descriptionEs") || "Descripción corta (ES)"}
          </label>
          <textarea
            id="partner-description-es"
            name="descriptionEs"
            rows="3"
            maxLength={MAX_DESC_LEN}
            value={form.descriptionEs}
            onChange={handleChange}
            placeholder={t("partnerships.placeholders.descriptionEs")}
          />
          <p className="field-error">{errors.descriptionEs || "\u00A0"}</p>
        </div>

        <div
          className={`form-field ${errors.countryEs ? "is-error" : ""}`.trim()}
        >
          <label htmlFor="partner-country-es">
            {t("partnerships.fields.countryEs") || "País (ES)"}
          </label>
          <input
            id="partner-country-es"
            name="countryEs"
            type="text"
            maxLength={MAX_COUNTRY_LEN}
            value={form.countryEs}
            onChange={handleChange}
            placeholder={
              t("partnerships.placeholders.countryEs") || "p.ej. España"
            }
          />
          <p className="field-error">{errors.countryEs || "\u00A0"}</p>
        </div>

        <hr className="partner-section-divider" />

        {/* Logo */}
        <div className={`form-field ${errors.logo ? "is-error" : ""}`.trim()}>
          <label htmlFor="partner-logo">
            {t("partnerships.fields.logo") || "Logo (opcjonalnie)"}
          </label>
          <div
            className="file-input"
            onClick={() => document.getElementById("partner-logo")?.click()}
          >
            <input
              id="partner-logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
            />
            <span className="file-input__button">
              {t("partnerships.buttons.chooseLogo") || "Wybierz plik"}
            </span>
            <span className="file-input__label">
              {logoFile
                ? logoFile.name
                : t("partnerships.placeholders.logo") || "Nie wybrano pliku"}
            </span>
          </div>
          <p className="field-hint">
            {t("partnerships.hints.logo") ||
              "Najlepiej kwadratowe logo w formacie PNG, JPG lub SVG (maks. 5 MB)."}
          </p>
          <p className="field-error">{errors.logo || "\u00A0"}</p>

          {logoPreview && (
            <div className="logo-preview">
              <img src={logoPreview} alt="Podgląd logo" />
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default AdminPartnerModal;
