import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
import RadioGroup from "../ui/RadioGroup";
import Checkbox from "../ui/Checkbox";
import Loader from "../ui/Loader"; // <-- Dodaj import
import DatePickerField from "../ui/DatePickerField";
import api from "../../utils/api";

const initialForm = {
  // Dane zgłaszającego
  applicantType: "",
  fullName: "",
  email: "",
  phone: "",
  country: "",
  city: "",

  // Zwierzak
  species: "",
  speciesOther: "",
  animalName: "",
  age: "",
  animalsCount: "",

  // Opis i sytuacja
  description: "",
  amount: "",
  currency: "",
  amountType: "",
  deadline: "",
  treatmentOngoing: false,
  needsInstallments: false,
  otherFundraiserLink: "",
  otherHelp: "",

  // Dane do wypłaty
  payoutName: "",
  payoutIban: "",
  payoutBankName: "",
  payoutBankCountry: "",
  payoutSwift: "",
  payoutAddress: "",

  // Zgody
  consentDataProcessing: false,
  consentTruth: false,
  consentPublicStory: false,
};

// proste limity długości (możesz sobie dopasować)
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_COUNTRY_LENGTH = 100;
const MAX_CITY_LENGTH = 100;
const MAX_ANIMAL_NAME_LENGTH = 100;
const MAX_AGE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 8000;
const MAX_OTHER_HELP_LENGTH = 1000;
const MAX_URL_LENGTH = 500;
const MAX_IBAN_LENGTH = 34;
const MAX_SWIFT_LENGTH = 11;
const MAX_PAYOUT_NAME_LENGTH = 100;
const MAX_BANK_NAME_LENGTH = 100;
const MAX_BANK_COUNTRY_LENGTH = 100;
const MAX_PAYOUT_ADDRESS_LENGTH = 255;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_FILES = 20;
// jeśli ten limit 5 zdjęć ma zostać – zostawiam, tylko wynoszę do stałej:
const MAX_PET_PHOTOS = 5;
const MAX_SPECIES_OTHER_LENGTH = 100;

function RequestSupportForm({ onShowAlert }) {
  const { t, i18n } = useTranslation("request");

  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState({
    petPhotos: [],
    documents: [],
  });

  const [errors, setErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const petPhotosInputRef = useRef(null);
  const documentsInputRef = useRef(null);

  // ===== WALIDACJA =====

  const validateField = (
    name,
    value,
    currentForm = form,
    currentFiles = files
  ) => {
    const trimmed = typeof value === "string" ? value.trim() : value;

    switch (name) {
      // --- Dane opiekuna ---
      case "applicantType": {
        if (!trimmed) return t("form.errors.applicantType.required");
        return "";
      }

      case "fullName": {
        if (!trimmed) return t("form.errors.fullName.required");
        if (trimmed.length < 3) return t("form.errors.fullName.min");
        if (trimmed.length > MAX_NAME_LENGTH)
          return t("form.errors.fullName.max", { max: MAX_NAME_LENGTH });
        return "";
      }

      case "email": {
        if (!trimmed) return t("form.errors.email.required");
        if (trimmed.length < 5) return t("form.errors.email.min");
        if (trimmed.length > MAX_EMAIL_LENGTH)
          return t("form.errors.email.max", { max: MAX_EMAIL_LENGTH });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) return t("form.errors.email.format");
        return "";
      }

      case "phone": {
        if (!trimmed) return t("form.errors.phone.required");

        // usuwamy spacje z środka
        const normalized = trimmed.replace(/\s/g, "");

        // dozwolone: same cyfry lub + na początku i dalej cyfry
        if (!/^\+?\d+$/.test(normalized)) {
          return t("form.errors.phone.digits"); // komunikat zmienimy w JSON-ie
        }

        const digitsOnly = normalized.replace(/^\+/, ""); // bez plusa do liczenia długości

        if (digitsOnly.length < 6) return t("form.errors.phone.min");
        if (digitsOnly.length > MAX_PHONE_LENGTH)
          return t("form.errors.phone.max", { max: MAX_PHONE_LENGTH });

        return "";
      }

      case "country": {
        if (!trimmed) return t("form.errors.country.required");
        if (trimmed.length < 2) return t("form.errors.country.min");
        if (trimmed.length > MAX_COUNTRY_LENGTH)
          return t("form.errors.country.max", { max: MAX_COUNTRY_LENGTH });
        return "";
      }

      case "city": {
        if (!trimmed) return "";
        if (trimmed.length < 2) return t("form.errors.city.min");
        if (trimmed.length > MAX_CITY_LENGTH)
          return t("form.errors.city.max", { max: MAX_CITY_LENGTH });
        return "";
      }

      // --- Zwierzak ---
      case "species": {
        if (!trimmed) return t("form.errors.species.required");
        return "";
      }

      case "speciesOther": {
        if (currentForm.species === "other") {
          if (!trimmed) return t("form.errors.speciesOther.required");
          if (trimmed.length < 2) return t("form.errors.speciesOther.min");
          if (trimmed.length > MAX_SPECIES_OTHER_LENGTH)
            return t("form.errors.speciesOther.max", {
              max: MAX_SPECIES_OTHER_LENGTH,
            });
        }
        return "";
      }

      case "animalName": {
        if (!trimmed) return t("form.errors.animalName.required");
        if (trimmed.length < 2) return t("form.errors.animalName.min");
        if (trimmed.length > MAX_ANIMAL_NAME_LENGTH)
          return t("form.errors.animalName.max", {
            max: MAX_ANIMAL_NAME_LENGTH,
          });
        return "";
      }

      case "animalsCount": {
        if (!trimmed) return t("form.errors.animalsCount.required");
        if (!/^\d+$/.test(trimmed))
          return t("form.errors.animalsCount.integer");
        const num = parseInt(trimmed, 10);
        if (!Number.isFinite(num) || num < 1)
          return t("form.errors.animalsCount.min");
        if (num > 99) return t("form.errors.animalsCount.max");
        return "";
      }

      case "age": {
        if (!trimmed) return "";
        if (trimmed.length > MAX_AGE_LENGTH)
          return t("form.errors.age.max", { max: MAX_AGE_LENGTH });
        return "";
      }

      // --- Opis sytuacji ---
      case "description": {
        if (!trimmed) return t("form.errors.description.required");
        if (trimmed.length < 30) return t("form.errors.description.min");
        if (trimmed.length > MAX_DESCRIPTION_LENGTH)
          return t("form.errors.description.max", {
            max: MAX_DESCRIPTION_LENGTH,
          });
        return "";
      }

      case "amount": {
        const str = (trimmed || "").replace(",", ".");
        if (!str) return t("form.errors.amount.required");
        if (!/^\d+(\.\d{1,2})?$/.test(str))
          return t("form.errors.amount.format"); // max 2 miejsca po przecinku

        const num = Number(str);
        if (!Number.isFinite(num) || num <= 0)
          return t("form.errors.amount.positive");

        if (num > 1000000) return t("form.errors.amount.max", { max: 1000000 });

        return "";
      }

      case "currency": {
        if (!trimmed) return t("form.errors.currency.required");
        return "";
      }

      case "amountType": {
        if (!trimmed) return t("form.errors.amountType.required");
        return "";
      }

      case "deadline": {
        if (!trimmed) return t("form.errors.deadline.required");
        // jeśli chcesz: tu możesz dodać dodatkowe sprawdzenie formatu / daty z przyszłości
        return "";
      }

      case "otherFundraiserLink": {
        if (!trimmed) return "";
        if (trimmed.length > MAX_URL_LENGTH)
          return t("form.errors.otherFundraiserLink.max", {
            max: MAX_URL_LENGTH,
          });
        // prosty URL-regex
        const urlRegex =
          /^(https?:\/\/)?([^\s.]+\.[^\s]{2,}|localhost)(\/[^\s]*)?$/i;
        if (!urlRegex.test(trimmed))
          return t("form.errors.otherFundraiserLink.format");
        return "";
      }

      case "otherHelp": {
        if (!trimmed) return "";
        if (trimmed.length > MAX_OTHER_HELP_LENGTH)
          return t("form.errors.otherHelp.max", { max: MAX_OTHER_HELP_LENGTH });
        return "";
      }

      // --- Załączniki ---
      case "petPhotos": {
        const petPhotos = currentFiles.petPhotos || [];
        const documents = currentFiles.documents || [];

        if (!petPhotos.length) {
          return t("form.errors.petPhotos.required");
        }

        const totalCount = petPhotos.length + documents.length;
        if (totalCount > MAX_TOTAL_FILES) {
          return t("form.errors.attachments.totalMax", {
            max: MAX_TOTAL_FILES,
          });
        }

        const tooBig = petPhotos.find(
          (item) => item?.file && item.file.size > MAX_FILE_SIZE_BYTES
        );
        if (tooBig) {
          return t("form.errors.attachments.fileMax", {
            maxMb: MAX_FILE_SIZE_MB,
          });
        }

        return "";
      }

      case "documents": {
        const petPhotos = currentFiles.petPhotos || [];
        const documents = currentFiles.documents || [];

        if (!documents.length) {
          return t("form.errors.documents.required");
        }

        const totalCount = petPhotos.length + documents.length;
        if (totalCount > MAX_TOTAL_FILES) {
          return t("form.errors.attachments.totalMax", {
            max: MAX_TOTAL_FILES,
          });
        }

        const tooBig = documents.find(
          (file) => file && file.size > MAX_FILE_SIZE_BYTES
        );
        if (tooBig) {
          return t("form.errors.attachments.fileMax", {
            maxMb: MAX_FILE_SIZE_MB,
          });
        }

        return "";
      }

      // --- Dane do wypłaty ---
      case "payoutName": {
        if (!trimmed) return t("form.errors.payoutName.required");
        if (trimmed.length < 3) return t("form.errors.payoutName.min");
        if (trimmed.length > MAX_PAYOUT_NAME_LENGTH)
          return t("form.errors.payoutName.max", {
            max: MAX_PAYOUT_NAME_LENGTH,
          });
        return "";
      }

      case "payoutIban": {
        if (!trimmed) return t("form.errors.payoutIban.required");
        const ibanNoSpaces = trimmed.replace(/\s+/g, "").toUpperCase();
        if (ibanNoSpaces.length < 15) return t("form.errors.payoutIban.min");
        if (ibanNoSpaces.length > MAX_IBAN_LENGTH)
          return t("form.errors.payoutIban.max", { max: MAX_IBAN_LENGTH });
        if (!/^[A-Z0-9]+$/.test(ibanNoSpaces))
          return t("form.errors.payoutIban.format");
        return "";
      }

      case "payoutSwift": {
        if (!trimmed) return t("form.errors.payoutSwift.required");
        const swift = trimmed.toUpperCase();
        if (!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(swift))
          return t("form.errors.payoutSwift.format");
        if (swift.length > MAX_SWIFT_LENGTH)
          return t("form.errors.payoutSwift.max", { max: MAX_SWIFT_LENGTH });
        return "";
      }

      case "payoutBankName": {
        if (!trimmed) return t("form.errors.payoutBankName.required");
        if (trimmed.length < 3) return t("form.errors.payoutBankName.min");
        if (trimmed.length > MAX_BANK_NAME_LENGTH)
          return t("form.errors.payoutBankName.max", {
            max: MAX_BANK_NAME_LENGTH,
          });
        return "";
      }

      case "payoutBankCountry": {
        if (!trimmed) return t("form.errors.payoutBankCountry.required");
        if (trimmed.length < 2) return t("form.errors.payoutBankCountry.min");
        if (trimmed.length > MAX_BANK_COUNTRY_LENGTH)
          return t("form.errors.payoutBankCountry.max", {
            max: MAX_BANK_COUNTRY_LENGTH,
          });
        return "";
      }

      case "payoutAddress": {
        if (!trimmed) return t("form.errors.payoutAddress.required");
        if (trimmed.length < 5) return t("form.errors.payoutAddress.min");
        if (trimmed.length > MAX_PAYOUT_ADDRESS_LENGTH)
          return t("form.errors.payoutAddress.max", {
            max: MAX_PAYOUT_ADDRESS_LENGTH,
          });
        return "";
      }

      // --- Zgody ---
      case "consentDataProcessing": {
        if (!currentForm.consentDataProcessing)
          return t("form.errors.consentDataProcessing.required");
        return "";
      }

      case "consentTruth": {
        if (!currentForm.consentTruth)
          return t("form.errors.consentTruth.required");
        return "";
      }

      case "consentPublicStory": {
        if (!currentForm.consentPublicStory)
          return t("form.errors.consentPublicStory.required");
        return "";
      }

      default:
        return "";
    }
  };

  const allFieldNames = [
    // z obiektu form
    ...Object.keys(initialForm),
    // plus załączniki
    "petPhotos",
    "documents",
  ];

  const validateForm = (values, filesState) => {
    const newErrors = {};
    allFieldNames.forEach((field) => {
      const val =
        field === "petPhotos" || field === "documents"
          ? filesState[field]
          : values[field];
      const msg = validateField(field, val, values, filesState);
      if (msg) newErrors[field] = msg;
    });
    return newErrors;
  };

  const getError = (field) => (hasSubmitted ? errors[field] : "");

  // ===== HANDLERY ZMIAN =====

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;

    // ograniczenia wprowadzania
    if (name === "fullName" && newValue.length > MAX_NAME_LENGTH) {
      newValue = newValue.slice(0, MAX_NAME_LENGTH);
    }

    if (name === "email" && newValue.length > MAX_EMAIL_LENGTH) {
      newValue = newValue.slice(0, MAX_EMAIL_LENGTH);
    }

    if (name === "phone") {
      let v = String(newValue);

      // usuń spacje
      v = v.replace(/\s/g, "");

      // sprawdź, czy pierwszy znak to "+"
      const hasPlus = v[0] === "+";

      // wyciągnij same cyfry
      const digits = v.replace(/\D/g, "");

      // limit długości cyfr
      const limitedDigits = digits.slice(0, MAX_PHONE_LENGTH);

      // zbuduj finalną wartość: opcjonalny plus + cyfry
      newValue = (hasPlus ? "+" : "") + limitedDigits;
    }

    if (name === "country" && newValue.length > MAX_COUNTRY_LENGTH) {
      newValue = newValue.slice(0, MAX_COUNTRY_LENGTH);
    }

    if (name === "city" && newValue.length > MAX_CITY_LENGTH) {
      newValue = newValue.slice(0, MAX_CITY_LENGTH);
    }

    if (name === "animalName" && newValue.length > MAX_ANIMAL_NAME_LENGTH) {
      newValue = newValue.slice(0, MAX_ANIMAL_NAME_LENGTH);
    }

    if (name === "age" && newValue.length > MAX_AGE_LENGTH) {
      newValue = newValue.slice(0, MAX_AGE_LENGTH);
    }

    if (name === "speciesOther" && newValue.length > MAX_SPECIES_OTHER_LENGTH) {
      newValue = newValue.slice(0, MAX_SPECIES_OTHER_LENGTH);
    }

    if (name === "animalsCount") {
      // tylko cyfry, brak przecinków i e
      newValue = String(newValue).replace(/\D/g, "");
    }

    if (name === "description" && newValue.length > MAX_DESCRIPTION_LENGTH) {
      newValue = newValue.slice(0, MAX_DESCRIPTION_LENGTH);
    }

    if (name === "otherHelp" && newValue.length > MAX_OTHER_HELP_LENGTH) {
      newValue = newValue.slice(0, MAX_OTHER_HELP_LENGTH);
    }

    if (name === "otherFundraiserLink" && newValue.length > MAX_URL_LENGTH) {
      newValue = newValue.slice(0, MAX_URL_LENGTH);
    }

    if (name === "payoutName" && newValue.length > MAX_PAYOUT_NAME_LENGTH) {
      newValue = newValue.slice(0, MAX_PAYOUT_NAME_LENGTH);
    }

    if (name === "payoutIban" && newValue.length > MAX_IBAN_LENGTH + 10) {
      // + spacje
      newValue = newValue.slice(0, MAX_IBAN_LENGTH + 10);
    }

    if (name === "payoutSwift" && newValue.length > MAX_SWIFT_LENGTH) {
      newValue = newValue.slice(0, MAX_SWIFT_LENGTH);
    }

    if (name === "payoutBankName" && newValue.length > MAX_BANK_NAME_LENGTH) {
      newValue = newValue.slice(0, MAX_BANK_NAME_LENGTH);
    }

    if (
      name === "payoutBankCountry" &&
      newValue.length > MAX_BANK_COUNTRY_LENGTH
    ) {
      newValue = newValue.slice(0, MAX_BANK_COUNTRY_LENGTH);
    }

    if (
      name === "payoutAddress" &&
      newValue.length > MAX_PAYOUT_ADDRESS_LENGTH
    ) {
      newValue = newValue.slice(0, MAX_PAYOUT_ADDRESS_LENGTH);
    }

    if (name === "amount") {
      // kwota: dot & comma = ., max 2 miejsca po przecinku, brak e
      let v = String(newValue).replace(",", ".");
      // tylko cyfry i kropka
      v = v.replace(/[^0-9.]/g, "");
      // tylko jedna kropka
      const parts = v.split(".");
      if (parts.length > 2) {
        v = parts[0] + "." + parts.slice(1).join("");
      }
      // max 2 miejsca po przecinku
      const [intPart, decPart] = v.split(".");
      if (decPart && decPart.length > 2) {
        v = intPart + "." + decPart.slice(0, 2);
      }
      newValue = v;
    }

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // jeśli user już próbował wysłać, to walidujemy na bieżąco
    if (hasSubmitted) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, newValue, { ...form, [name]: newValue }),
      }));
    }
  };

  const handlePetPhotosChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const currentTotal = files.petPhotos.length + files.documents.length;
    const remainingTotalSlots = MAX_TOTAL_FILES - currentTotal;

    if (remainingTotalSlots <= 0) {
      onShowAlert?.({
        variant: "error",
        message: t("form.errors.attachments.totalMax", {
          max: MAX_TOTAL_FILES,
        }),
      });
      e.target.value = "";
      return;
    }

    // jeśli chcesz nadal trzymać limit 5 zdjęć:
    const remainingPhotoSlots = Math.max(
      0,
      MAX_PET_PHOTOS - files.petPhotos.length
    );

    let slots = Math.min(remainingTotalSlots, remainingPhotoSlots);
    if (slots <= 0) {
      onShowAlert?.({
        variant: "error",
        message: t("form.errors.attachments.totalMax", {
          max: MAX_TOTAL_FILES,
        }),
      });
      e.target.value = "";
      return;
    }

    let skippedTooBig = false;

    selected.forEach((file) => {
      if (slots <= 0) return;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        skippedTooBig = true;
        return;
      }

      slots -= 1;

      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target.result;
        setFiles((prev) => {
          const updated = {
            ...prev,
            petPhotos: [...prev.petPhotos, { file, preview }],
          };

          if (hasSubmitted) {
            setErrors((prevErr) => ({
              ...prevErr,
              petPhotos: validateField(
                "petPhotos",
                updated.petPhotos,
                form,
                updated
              ),
              documents: validateField(
                "documents",
                updated.documents,
                form,
                updated
              ),
            }));
          }

          return updated;
        });
      };
      reader.readAsDataURL(file);
    });

    if (skippedTooBig) {
      onShowAlert?.({
        variant: "error",
        message: t("form.errors.attachments.fileMax", {
          maxMb: MAX_FILE_SIZE_MB,
        }),
      });
    }

    e.target.value = "";
  };

  const handleRemovePetPhoto = (index) => {
    setFiles((prev) => {
      const updated = {
        ...prev,
        petPhotos: prev.petPhotos.filter((_, i) => i !== index),
      };
      if (hasSubmitted) {
        setErrors((prevErr) => ({
          ...prevErr,
          petPhotos: validateField(
            "petPhotos",
            updated.petPhotos,
            form,
            updated
          ),
        }));
      }
      return updated;
    });
  };

  const handleDocumentsChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const currentTotal = files.petPhotos.length + files.documents.length;
    let remainingTotalSlots = MAX_TOTAL_FILES - currentTotal;

    if (remainingTotalSlots <= 0) {
      onShowAlert?.({
        variant: "error",
        message: t("form.errors.attachments.totalMax", {
          max: MAX_TOTAL_FILES,
        }),
      });
      e.target.value = "";
      return;
    }

    const acceptedFiles = [];
    let skippedTooBig = false;

    for (const file of selected) {
      if (remainingTotalSlots <= 0) break;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        skippedTooBig = true;
        continue;
      }

      acceptedFiles.push(file);
      remainingTotalSlots -= 1;
    }

    if (!acceptedFiles.length && skippedTooBig) {
      onShowAlert?.({
        variant: "error",
        message: t("form.errors.attachments.fileMax", {
          maxMb: MAX_FILE_SIZE_MB,
        }),
      });
      e.target.value = "";
      return;
    }

    if (skippedTooBig) {
      onShowAlert?.({
        variant: "error",
        message: t("form.errors.attachments.fileMax", {
          maxMb: MAX_FILE_SIZE_MB,
        }),
      });
    }

    if (!acceptedFiles.length) {
      e.target.value = "";
      return;
    }

    setFiles((prev) => {
      const updated = {
        ...prev,
        documents: [...prev.documents, ...acceptedFiles],
      };

      if (hasSubmitted) {
        setErrors((prevErr) => ({
          ...prevErr,
          documents: validateField(
            "documents",
            updated.documents,
            form,
            updated
          ),
          petPhotos: validateField(
            "petPhotos",
            updated.petPhotos,
            form,
            updated
          ),
        }));
      }

      return updated;
    });

    e.target.value = "";
  };

  const handleRemoveDocument = (index) => {
    setFiles((prev) => {
      const updated = {
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index),
      };
      if (hasSubmitted) {
        setErrors((prevErr) => ({
          ...prevErr,
          documents: validateField(
            "documents",
            updated.documents,
            form,
            updated
          ),
        }));
      }
      return updated;
    });
  };

  const handlePreviewDocument = (file) => {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);

    // 1. Walidacja na froncie
    const validationErrors = validateForm(form, files);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      onShowAlert?.({
        variant: "error",
        message: t("form.alerts.validation"),
      });
      return;
    }

    setIsSubmitting(true);

    // 2. Przygotowanie FormData (bo wysyłamy pliki)
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      let value = form[key];
      if (value === null || value === undefined) value = "";
      formData.append(key, value);
    });

    formData.append("submissionLanguage", i18n.language || "pl");

    files.petPhotos.forEach((item) => {
      formData.append("petPhotos", item.file);
    });

    files.documents.forEach((file) => {
      formData.append("documents", file);
    });

    try {
      const response = await api.post("/requests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // jeśli backend zwraca jakiś znacznik sukcesu, możesz go tu sprawdzić,
      // np. if (!response.data?.success) throw new Error("...");

      console.log("Response:", response.data);

      onShowAlert?.({
        variant: "success",
        message: t("form.alerts.success"),
      });

      // 🔹 Reset TYLKO przy SUKCESIE backendu:
      setForm(initialForm);
      setFiles({ petPhotos: [], documents: [] });
      setErrors({});
      setHasSubmitted(false);
    } catch (error) {
      console.error("error sending report:", error);

      let errorMessage = t("form.alerts.error");

      if (error.response?.data?.details) {
        errorMessage = error.response.data.details.join(", ");
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      onShowAlert?.({
        variant: "error",
        message: errorMessage,
      });

      // 🔹 UWAGA: tutaj NIC nie resetujemy,
      // formularz i pliki zostają takie, jak były
    } finally {
      setIsSubmitting(false);
    }
  };

  // wygodne aliasy błędów
  const applicantTypeError = getError("applicantType");
  const fullNameError = getError("fullName");
  const emailError = getError("email");
  const phoneError = getError("phone");
  const countryError = getError("country");
  const cityError = getError("city");

  const speciesError = getError("species");
  const speciesOtherError = getError("speciesOther");
  const animalNameError = getError("animalName");
  const animalsCountError = getError("animalsCount");
  const ageError = getError("age");

  const descriptionError = getError("description");
  const amountError = getError("amount");
  const deadlineError = getError("deadline");
  const otherFundraiserLinkError = getError("otherFundraiserLink");
  const otherHelpError = getError("otherHelp");

  const payoutNameError = getError("payoutName");
  const payoutIbanError = getError("payoutIban");
  const payoutSwiftError = getError("payoutSwift");
  const payoutBankNameError = getError("payoutBankName");
  const payoutBankCountryError = getError("payoutBankCountry");
  const payoutAddressError = getError("payoutAddress");

  const consentDataProcessingError = getError("consentDataProcessing");
  const consentTruthError = getError("consentTruth");
  const consentPublicStoryError = getError("consentPublicStory");

  const petPhotosError = getError("petPhotos");
  const documentsError = getError("documents");

  return (
    <form className="request-form" onSubmit={handleSubmit} noValidate>
      {/* === 1. Dane zgłaszającego === */}
      <section className="request-section request-section--applicant">
        <h3>{t("form.sections.applicant")}</h3>

        {/* Typ zgłaszającego */}
        <div className={`form-field ${applicantTypeError ? "is-error" : ""}`}>
          <label>{t("form.fields.applicantType.label")}</label>
          <RadioGroup
            name="applicantType"
            value={form.applicantType}
            onChange={(val) => {
              setForm((prev) => ({ ...prev, applicantType: val }));
              if (hasSubmitted) {
                setErrors((prev) => ({
                  ...prev,
                  applicantType: validateField("applicantType", val, {
                    ...form,
                    applicantType: val,
                  }),
                }));
              }
            }}
            inline
            options={[
              {
                value: "person",
                label: t("form.fields.applicantType.options.person"),
              },
              {
                value: "organization",
                label: t("form.fields.applicantType.options.organization"),
              },
              {
                value: "vetClinic",
                label: t("form.fields.applicantType.options.vetClinic"),
              },
            ]}
          />
          <p className="field-error">{applicantTypeError || "\u00A0"}</p>
        </div>

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

        <div className="request-row request-row--applicant">
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

          <div className={`form-field ${phoneError ? "is-error" : ""}`}>
            <label htmlFor="phone">{t("form.fields.phone.label")}</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={handleChange}
              placeholder={t("form.fields.phone.placeholder")}
              maxLength={MAX_PHONE_LENGTH}
              required
            />
            <p className="field-error">{phoneError || "\u00A0"}</p>
          </div>
        </div>

        <div className="request-row request-row--applicant">
          <div className={`form-field ${countryError ? "is-error" : ""}`}>
            <label htmlFor="country">{t("form.fields.country.label")}</label>
            <input
              id="country"
              name="country"
              type="text"
              value={form.country}
              onChange={handleChange}
              placeholder={t("form.fields.country.placeholder")}
              maxLength={MAX_COUNTRY_LENGTH}
              required
            />
            <p className="field-error">{countryError || "\u00A0"}</p>
          </div>

          <div className={`form-field ${cityError ? "is-error" : ""}`}>
            <label htmlFor="city">
              {t("form.fields.city.label")}
              <span className="field-hint"> ({t("form.fields.optional")})</span>
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              placeholder={t("form.fields.city.placeholder")}
              maxLength={MAX_CITY_LENGTH}
            />
            <p className="field-error">{cityError || "\u00A0"}</p>
          </div>
        </div>
      </section>

      {/* === 2. Dane zwierzaka === */}
      <section className="request-section request-section--animal">
        <h3>{t("form.sections.animal")}</h3>

        <div className={`form-field ${speciesError ? "is-error" : ""}`}>
          <label>{t("form.fields.species.label")}</label>
          <RadioGroup
            name="species"
            value={form.species}
            onChange={(val) => {
              setForm((prev) => ({ ...prev, species: val }));
              if (hasSubmitted) {
                setErrors((prev) => ({
                  ...prev,
                  species: validateField("species", val, {
                    ...form,
                    species: val,
                  }),
                }));
              }
            }}
            options={[
              { value: "rat", label: t("form.fields.species.options.rat") },
              {
                value: "guineaPig",
                label: t("form.fields.species.options.guineaPig"),
              },
              { value: "other", label: t("form.fields.species.options.other") },
            ]}
          />
          <p className="field-error">{speciesError || "\u00A0"}</p>
        </div>

        {form.species === "other" && (
          <div className={`form-field ${speciesOtherError ? "is-error" : ""}`}>
            <label htmlFor="speciesOther">
              {t("form.fields.speciesOther.label")}
            </label>
            <input
              id="speciesOther"
              name="speciesOther"
              type="text"
              value={form.speciesOther}
              onChange={handleChange}
              placeholder={t("form.fields.speciesOther.placeholder")}
              maxLength={MAX_SPECIES_OTHER_LENGTH}
            />
            <p className="field-error">{speciesOtherError || "\u00A0"}</p>
          </div>
        )}

        <div className={`form-field ${animalNameError ? "is-error" : ""}`}>
          <label htmlFor="animalName">
            {t("form.fields.animalName.label")}
          </label>
          <input
            id="animalName"
            name="animalName"
            type="text"
            value={form.animalName}
            onChange={handleChange}
            placeholder={t("form.fields.animalName.placeholder")}
            maxLength={MAX_ANIMAL_NAME_LENGTH}
            required
          />
          <p className="field-error">{animalNameError || "\u00A0"}</p>
        </div>

        <div className="request-row request-row--animal">
          <div className={`form-field ${animalsCountError ? "is-error" : ""}`}>
            <label htmlFor="animalsCount">
              {t("form.fields.animalsCount.label")}
            </label>
            <input
              id="animalsCount"
              name="animalsCount"
              type="text"
              inputMode="numeric"
              value={form.animalsCount}
              onChange={handleChange}
              placeholder={t("form.fields.animalsCount.placeholder")}
              required
            />
            <p className="field-error">{animalsCountError || "\u00A0"}</p>
          </div>

          <div className={`form-field ${ageError ? "is-error" : ""}`}>
            <label htmlFor="age">
              {t("form.fields.age.label")}{" "}
              <span className="field-hint">({t("form.fields.optional")})</span>
            </label>
            <input
              id="age"
              name="age"
              type="text"
              value={form.age}
              onChange={handleChange}
              placeholder={t("form.fields.age.placeholder")}
              maxLength={MAX_AGE_LENGTH}
            />
            <p className="field-error">{ageError || "\u00A0"}</p>
          </div>
        </div>
      </section>

      {/* === 3. Opis sytuacji i potrzeby === */}
      <section className="request-section request-section--case">
        <h3>{t("form.sections.case")}</h3>

        <div className={`form-field ${descriptionError ? "is-error" : ""}`}>
          <label htmlFor="description">
            {t("form.fields.description.label")}
          </label>
          <textarea
            id="description"
            name="description"
            rows="6"
            value={form.description}
            onChange={handleChange}
            placeholder={t("form.fields.description.placeholder")}
            maxLength={MAX_DESCRIPTION_LENGTH}
            required
          />
          <p className="field-error">{descriptionError || "\u00A0"}</p>
        </div>

        <div className="request-row request-row--amount">
          <div className={`form-field ${amountError ? "is-error" : ""}`}>
            <label htmlFor="amount">{t("form.fields.amount.label")}</label>
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={handleChange}
              placeholder={t("form.fields.amount.placeholder")}
              required
            />
            <p className="field-error">{amountError || "\u00A0"}</p>
          </div>

          <div className="form-field">
            <label>{t("form.fields.currency.label")}</label>
            <RadioGroup
              name="currency"
              value={form.currency}
              onChange={(val) => {
                setForm((prev) => ({ ...prev, currency: val }));
                if (hasSubmitted) {
                  setErrors((prev) => ({
                    ...prev,
                    currency: validateField("currency", val, {
                      ...form,
                      currency: val,
                    }),
                  }));
                }
              }}
              inline
              options={[
                {
                  value: "EUR",
                  label: t("form.fields.currency.options.eur"),
                },
                {
                  value: "PLN",
                  label: t("form.fields.currency.options.pln"),
                },
              ]}
            />
            <p className="field-error">{getError("currency") || "\u00A0"}</p>
          </div>
        </div>

        <div className="form-field">
          <label>{t("form.fields.amountType.label")}</label>
          <RadioGroup
            name="amountType"
            value={form.amountType}
            onChange={(val) => {
              setForm((prev) => ({ ...prev, amountType: val }));
              if (hasSubmitted) {
                setErrors((prev) => ({
                  ...prev,
                  amountType: validateField("amountType", val, {
                    ...form,
                    amountType: val,
                  }),
                }));
              }
            }}
            inline
            options={[
              {
                value: "estimated",
                label: t("form.fields.amountType.options.estimated"),
              },
              {
                value: "exact",
                label: t("form.fields.amountType.options.exact"),
              },
            ]}
          />
          <p className="field-error">{getError("amountType") || "\u00A0"}</p>
        </div>

        <div className={`form-field ${deadlineError ? "is-error" : ""}`}>
          <label htmlFor="deadline">{t("form.fields.deadline.label")}</label>
          <DatePickerField
            id="deadline"
            name="deadline"
            value={form.deadline}
            onChange={(val) => {
              setForm((prev) => ({ ...prev, deadline: val }));
              if (hasSubmitted) {
                setErrors((prev) => ({
                  ...prev,
                  deadline: validateField("deadline", val, {
                    ...form,
                    deadline: val,
                  }),
                }));
              }
            }}
            placeholder={t("form.fields.deadline.placeholder")}
          />
          <p className="field-error">{deadlineError || "\u00A0"}</p>
        </div>

        <div className="checkboxes">
          <div className="form-field">
            <Checkbox
              name="treatmentOngoing"
              checked={form.treatmentOngoing}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, treatmentOngoing: val }))
              }
            >
              {t("form.fields.treatmentOngoing.label")}
            </Checkbox>
          </div>

          <div className="form-field">
            <Checkbox
              name="needsInstallments"
              checked={form.needsInstallments}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, needsInstallments: val }))
              }
            >
              {t("form.fields.needsInstallments.label")}
            </Checkbox>
          </div>
        </div>

        <div
          className={`form-field ${otherFundraiserLinkError ? "is-error" : ""}`}
        >
          <label htmlFor="otherFundraiserLink">
            {t("form.fields.otherFundraiserLink.label")}
          </label>
          <input
            id="otherFundraiserLink"
            name="otherFundraiserLink"
            type="text"
            value={form.otherFundraiserLink}
            onChange={handleChange}
            placeholder={t("form.fields.otherFundraiserLink.placeholder")}
          />
          <p className="field-error">{otherFundraiserLinkError || "\u00A0"}</p>
        </div>

        <div className={`form-field ${otherHelpError ? "is-error" : ""}`}>
          <label htmlFor="otherHelp">{t("form.fields.otherHelp.label")}</label>
          <textarea
            id="otherHelp"
            name="otherHelp"
            rows="3"
            value={form.otherHelp}
            onChange={handleChange}
            placeholder={t("form.fields.otherHelp.placeholder")}
            maxLength={MAX_OTHER_HELP_LENGTH}
          />
          <p className="field-error">{otherHelpError || "\u00A0"}</p>
        </div>
      </section>

      {/* === 4. Załączniki === */}
      <section className="request-section request-section--attachments">
        <h3>{t("form.sections.attachments")}</h3>

        <div className={`form-field ${petPhotosError ? "is-error" : ""}`}>
          <label htmlFor="petPhotos">{t("form.fields.petPhotos.label")}</label>

          <div
            className="file-input"
            onClick={() => petPhotosInputRef.current?.click()}
          >
            <input
              ref={petPhotosInputRef}
              id="petPhotos"
              name="petPhotos"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePetPhotosChange}
            />
            <span className="file-input__button">
              {t("form.fields.petPhotos.button")}
            </span>
            <span className="file-input__label">
              {files.petPhotos.length > 0
                ? t("form.fields.petPhotos.selected", {
                    count: files.petPhotos.length,
                  })
                : t("form.fields.petPhotos.placeholder")}
            </span>
          </div>

          <p className="field-hint">{t("form.fields.petPhotos.hint")}</p>
          <p className="field-error">{petPhotosError || "\u00A0"}</p>

          {files.petPhotos.length > 0 && (
            <div className="file-previews">
              {files.petPhotos.map((item, index) => (
                <div className="file-preview" key={index}>
                  <img src={item.preview} alt={item.file.name} />
                  <button
                    type="button"
                    className="file-preview__remove"
                    onClick={() => handleRemovePetPhoto(index)}
                    aria-label={t("form.fields.petPhotos.remove")}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`form-field ${documentsError ? "is-error" : ""}`}>
          <label htmlFor="documents">{t("form.fields.documents.label")}</label>

          <div
            className="file-input"
            onClick={() => documentsInputRef.current?.click()}
          >
            <input
              ref={documentsInputRef}
              id="documents"
              name="documents"
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={handleDocumentsChange}
            />
            <span className="file-input__button">
              {t("form.fields.documents.button")}
            </span>
            <span className="file-input__label">
              {files.documents.length > 0
                ? t("form.fields.documents.selected", {
                    count: files.documents.length,
                  })
                : t("form.fields.documents.placeholder")}
            </span>
          </div>

          <p className="field-hint">{t("form.fields.documents.hint")}</p>
          <p className="field-error">{documentsError || "\u00A0"}</p>

          {files.documents.length > 0 && (
            <ul className="file-list">
              {files.documents.map((file, index) => (
                <li className="file-list__item" key={index}>
                  <span className="file-list__dot" />
                  <span className="file-list__name">{file.name}</span>

                  <div className="file-list__actions">
                    <button
                      type="button"
                      className="file-list__btn file-list__btn--preview"
                      onClick={() => handlePreviewDocument(file)}
                    >
                      {t("form.fields.documents.preview")}
                    </button>
                    <button
                      type="button"
                      className="file-list__btn file-list__btn--remove"
                      onClick={() => handleRemoveDocument(index)}
                    >
                      {t("form.fields.documents.remove")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* === 5. Dane do wypłaty === */}
      <section className="request-section request-section--payout">
        <h3>{t("form.sections.payout")}</h3>

        <div className={`form-field ${payoutNameError ? "is-error" : ""}`}>
          <label htmlFor="payoutName">
            {t("form.fields.payoutName.label")}
          </label>
          <input
            id="payoutName"
            name="payoutName"
            type="text"
            value={form.payoutName}
            onChange={handleChange}
            placeholder={t("form.fields.payoutName.placeholder")}
            maxLength={MAX_PAYOUT_NAME_LENGTH}
            required
          />
          <p className="field-error">{payoutNameError || "\u00A0"}</p>
        </div>

        <div className="request-row request-row--payout">
          <div className={`form-field ${payoutIbanError ? "is-error" : ""}`}>
            <label htmlFor="payoutIban">
              {t("form.fields.payoutIban.label")}
            </label>
            <input
              id="payoutIban"
              name="payoutIban"
              type="text"
              value={form.payoutIban}
              onChange={handleChange}
              placeholder={t("form.fields.payoutIban.placeholder")}
              required
            />
            <p className="field-error">{payoutIbanError || "\u00A0"}</p>
          </div>

          <div className={`form-field ${payoutSwiftError ? "is-error" : ""}`}>
            <label htmlFor="payoutSwift">
              {t("form.fields.payoutSwift.label")}
            </label>
            <input
              id="payoutSwift"
              name="payoutSwift"
              type="text"
              value={form.payoutSwift}
              onChange={handleChange}
              placeholder={t("form.fields.payoutSwift.placeholder")}
              required
            />
            <p className="field-error">{payoutSwiftError || "\u00A0"}</p>
          </div>
        </div>

        <div className="request-row request-row--payout">
          <div
            className={`form-field ${payoutBankNameError ? "is-error" : ""}`}
          >
            <label htmlFor="payoutBankName">
              {t("form.fields.payoutBankName.label")}
            </label>
            <input
              id="payoutBankName"
              name="payoutBankName"
              type="text"
              value={form.payoutBankName}
              onChange={handleChange}
              placeholder={t("form.fields.payoutBankName.placeholder")}
              maxLength={MAX_BANK_NAME_LENGTH}
              required
            />
            <p className="field-error">{payoutBankNameError || "\u00A0"}</p>
          </div>

          <div
            className={`form-field ${payoutBankCountryError ? "is-error" : ""}`}
          >
            <label htmlFor="payoutBankCountry">
              {t("form.fields.payoutBankCountry.label")}
            </label>
            <input
              id="payoutBankCountry"
              name="payoutBankCountry"
              type="text"
              value={form.payoutBankCountry}
              onChange={handleChange}
              placeholder={t("form.fields.payoutBankCountry.placeholder")}
              maxLength={MAX_BANK_COUNTRY_LENGTH}
              required
            />
            <p className="field-error">{payoutBankCountryError || "\u00A0"}</p>
          </div>
        </div>

        <div className={`form-field ${payoutAddressError ? "is-error" : ""}`}>
          <label htmlFor="payoutAddress">
            {t("form.fields.payoutAddress.label")}
          </label>
          <input
            id="payoutAddress"
            name="payoutAddress"
            type="text"
            value={form.payoutAddress}
            onChange={handleChange}
            placeholder={t("form.fields.payoutAddress.placeholder")}
            maxLength={MAX_PAYOUT_ADDRESS_LENGTH}
            required
          />
          <p className="field-hint">{t("form.fields.payoutAddress.hint")}</p>
          <p className="field-error">{payoutAddressError || "\u00A0"}</p>
        </div>
      </section>

      {/* === 6. Zgody === */}
      <section className="request-section request-section--consents">
        <h3>{t("form.sections.consents")}</h3>

        <div
          className={`form-field ${
            consentDataProcessingError ? "is-error" : ""
          }`}
        >
          <Checkbox
            name="consentDataProcessing"
            checked={form.consentDataProcessing}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, consentDataProcessing: value }));
              if (hasSubmitted) {
                setErrors((prev) => ({
                  ...prev,
                  consentDataProcessing: validateField(
                    "consentDataProcessing",
                    value,
                    { ...form, consentDataProcessing: value }
                  ),
                }));
              }
            }}
          >
            {t("form.fields.consentDataProcessing.label")}
          </Checkbox>
          <p className="field-error">
            {consentDataProcessingError || "\u00A0"}
          </p>
        </div>

        <div className={`form-field ${consentTruthError ? "is-error" : ""}`}>
          <Checkbox
            name="consentTruth"
            checked={form.consentTruth}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, consentTruth: value }));
              if (hasSubmitted) {
                setErrors((prev) => ({
                  ...prev,
                  consentTruth: validateField("consentTruth", value, {
                    ...form,
                    consentTruth: value,
                  }),
                }));
              }
            }}
          >
            {t("form.fields.consentTruth.label")}
          </Checkbox>
          <p className="field-error">{consentTruthError || "\u00A0"}</p>
        </div>

        <div
          className={`form-field ${consentPublicStoryError ? "is-error" : ""}`}
        >
          <Checkbox
            name="consentPublicStory"
            checked={form.consentPublicStory}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, consentPublicStory: value }));
              if (hasSubmitted) {
                setErrors((prev) => ({
                  ...prev,
                  consentPublicStory: validateField(
                    "consentPublicStory",
                    value,
                    { ...form, consentPublicStory: value }
                  ),
                }));
              }
            }}
          >
            {t("form.fields.consentPublicStory.label")}
          </Checkbox>
          <p className="field-error">{consentPublicStoryError || "\u00A0"}</p>
        </div>
      </section>

      <div className="form-actions">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isSubmitting} // Zablokuj klikanie podczas wysyłania
        >
          {isSubmitting ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Loader size="sm" className="loader-white" />
              <span>{t("form.submitting") || "Wysyłanie..."}</span>
            </div>
          ) : (
            t("form.submit")
          )}
        </Button>
      </div>
    </form>
  );
}

export default RequestSupportForm;
