import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Check,
  AlertTriangle,
  FileText,
  Download,
  Upload,
  Trash2,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";

// Importy UI
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Alert from "../../components/ui/Alert";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import api from "../../utils/api";

const generateSlug = (text, id) => {
  if (!text) return "";
  const slug = text
    .toLowerCase()
    .replace(/ł/g, "l")
    .replace(/ś/g, "s")
    .replace(/ć/g, "c")
    .replace(/ą/g, "a")
    .replace(/ę/g, "e")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${slug}-${id || "new"}`;
};

const CreateProjectModal = ({ isOpen, onClose, request, onSuccess }) => {
  const { t } = useTranslation("admin");

  // --- STANY UI (ALERT / CONFIRM) ---
  const [alert, setAlert] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    variant: "info",
    onConfirm: null,
  });

  // --- STAN DANYCH ---
  const [formData, setFormData] = useState({
    title: { pl: "", en: "", es: "" },
    description: { pl: "", en: "", es: "" },
    country: { pl: "", en: "", es: "" },
    speciesOther: { pl: "", en: "", es: "" },
    age: { pl: "", en: "", es: "" },
    slug: "",
    isUrgent: false,
    status: "draft",
    applicantType: "person",
    fullName: "",
    animalName: "",
    animalsCount: 1,
    species: "rat",
    city: "",
    amountTarget: 0,
    amountCollected: 0,
    currency: "EUR",
    deadline: "",
  });

  const [activeLang, setActiveLang] = useState("pl");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // --- STAN PLIKÓW ---
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [coverSelection, setCoverSelection] = useState(null);

  // --- INICJALIZACJA ---
  useEffect(() => {
    if (request && isOpen) {
      const lang = request.submissionLanguage || "pl";
      const setLangVal = (val) => ({
        pl: lang === "pl" ? val || "" : "",
        en: lang === "en" ? val || "" : "",
        es: lang === "es" ? val || "" : "",
      });
      const formattedDeadline = request.deadline
        ? new Date(request.deadline).toISOString().split("T")[0]
        : "";

      setFormData({
        title: setLangVal(request.animalName),
        description: setLangVal(request.description),
        country: setLangVal(request.country),
        speciesOther: setLangVal(request.speciesOther),
        age: setLangVal(request.age),
        slug: generateSlug(request.animalName, request.id),
        isUrgent: false,
        status: "active",
        applicantType: request.applicantType || "person",
        fullName: request.fullName || "",
        animalName: request.animalName || "",
        animalsCount: request.animalsCount || 1,
        species: request.species || "rat",
        city: request.city || "",
        amountTarget: request.amount || 0,
        amountCollected: 0,
        currency: request.currency || "EUR",
        deadline: formattedDeadline,
      });

      setIsSlugManuallyEdited(false);
      setActiveLang(lang);

      const allFiles = [
        ...(request.petPhotos || []),
        ...(request.documents || []),
      ];
      setSelectedFileIds(allFiles.map((f) => f.id));

      setNewPhotos([]);
      setNewDocuments([]);
      setAlert(null);

      if (request.petPhotos?.length > 0) {
        setCoverSelection({ type: "existing", id: request.petPhotos[0].id });
      } else {
        setCoverSelection(null);
      }
    }

    return () => {
      newPhotos.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [request, isOpen]);

  // --- HANDLERY FORMULARZA ---
  const handleTransChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: { ...prev[field], [activeLang]: value },
    }));
    if (
      field === "title" &&
      !isSlugManuallyEdited &&
      activeLang === (request?.submissionLanguage || "pl")
    ) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value, request?.id),
      }));
    }
  };

  const handleGlobalChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- HANDLERY PLIKÓW ---
  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const processed = files.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      isPhoto: true,
    }));
    setNewPhotos((prev) => [...prev, ...processed]);
    e.target.value = "";
  };

  const handleAddDocuments = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const processed = files.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      isPhoto: false,
    }));
    setNewDocuments((prev) => [...prev, ...processed]);
    e.target.value = "";
  };

  const removeNewPhoto = (tempId) => {
    setNewPhotos((prev) => prev.filter((p) => p.id !== tempId));
    if (coverSelection?.type === "new" && coverSelection.id === tempId) {
      setCoverSelection(null);
    }
  };

  const removeNewDocument = (tempId) => {
    setNewDocuments((prev) => prev.filter((d) => d.id !== tempId));
  };

  const toggleExistingFile = (id) => {
    if (selectedFileIds.includes(id)) {
      setSelectedFileIds((prev) => prev.filter((fid) => fid !== id));
      if (coverSelection?.type === "existing" && coverSelection.id === id) {
        setCoverSelection(null);
      }
    } else {
      setSelectedFileIds((prev) => [...prev, id]);
    }
  };

  const handleSetCover = (type, id) => {
    setCoverSelection({ type, id });
    if (type === "existing" && !selectedFileIds.includes(id)) {
      setSelectedFileIds((prev) => [...prev, id]);
    }
  };

  // --- LOGIKA WYSYŁKI ---
  const executeSubmit = async () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    setIsSubmitting(true);
    setAlert(null);

    let finalCoverId = coverSelection;
    if (
      coverSelection?.type === "existing" &&
      !selectedFileIds.includes(coverSelection.id)
    ) {
      finalCoverId = null;
    }

    try {
      const data = new FormData();
      data.append("status", "approved");

      // Mapa nazw
      const newFileNamesMap = {};
      newPhotos.forEach((p) => {
        newFileNamesMap[p.id] = p.file.name;
      });
      newDocuments.forEach((d) => {
        newFileNamesMap[d.id] = d.file.name;
      });

      const projectPayload = {
        ...formData,
        selectedFileIds,
        coverSelection: finalCoverId,
        newFileNames: newFileNamesMap,
      };

      data.append("projectData", JSON.stringify(projectPayload));

      newPhotos.forEach((p) => {
        const extension = p.file.name.split(".").pop();
        const fileNameToSend = `${p.id}.${extension}`;
        data.append("newPhotos", p.file, fileNameToSend);
      });

      newDocuments.forEach((d) => {
        const extension = d.file.name.split(".").pop();
        const fileNameToSend = `${d.id}.${extension}`;
        data.append("newDocuments", d.file, fileNameToSend);
      });

      await api.patch(`/requests/${request.id}/status`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Błąd tworzenia zbiórki:", error);
      setAlert({
        variant: "error",
        message: t("status.errorMessage") || "Wystąpił błąd.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Walidacja
  const handlePreSubmit = () => {
    const showErr = (msg) => setAlert({ variant: "error", message: msg });

    // --- POPRAWKI DŁUGOŚCI (VARCHAR) ---
    if (!formData.animalName.trim())
      return showErr(t("projects.errors.animalNameRequired"));
    if (formData.animalName.length > 100)
      return showErr("Imię zwierzaka jest za długie (max 100 znaków)."); // VARCHAR(100)

    if (!formData.fullName.trim())
      return showErr(t("projects.errors.fullNameRequired"));
    if (formData.fullName.length > 255)
      return showErr("Imię i nazwisko jest za długie (max 255 znaków)."); // VARCHAR(255)

    if (!formData.slug.trim())
      return showErr(t("projects.errors.slugRequired"));
    if (formData.slug.length > 255)
      return showErr("Slug jest za długi (max 255 znaków)."); // VARCHAR(255)

    if (formData.city && formData.city.length > 100)
      return showErr("Nazwa miasta jest za długa (max 100 znaków)."); // VARCHAR(100)

    // --- POPRAWKI LICZBOWE ---
    if (!formData.amountTarget || formData.amountTarget <= 0)
      return showErr(t("projects.errors.amountTargetPositive"));

    // Zabezpieczenie przed ujemną liczbą zwierząt
    if (formData.animalsCount < 1)
      return showErr("Liczba zwierząt musi wynosić minimum 1.");

    // Zabezpieczenie przed ujemną kwotą zebraną
    if (formData.amountCollected < 0)
      return showErr("Zebrana kwota nie może być ujemna.");

    // --- POPRAWKI DATY ---
    if (!formData.deadline)
      return showErr(t("projects.errors.deadlineRequired"));

    // Sprawdzenie czy data nie jest z przeszłości
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.deadline);
    if (selectedDate < today)
      return showErr("Termin zbiórki nie może być datą z przeszłości.");

    const languages = ["pl", "en", "es"];
    const requiredTransFields = ["title", "description", "country"];

    for (const lang of languages) {
      const langLabel = lang.toUpperCase();
      for (const field of requiredTransFields) {
        if (!formData[field][lang]?.trim()) {
          setActiveLang(lang);
          const fieldName = t(`projects.fields.${field}`);
          showErr(
            t("projects.errors.fieldRequiredInLang", {
              field: fieldName,
              lang: langLabel,
            })
          );
          return;
        }
      }
      if (formData.species === "other") {
        if (!formData.speciesOther[lang]?.trim()) {
          setActiveLang(lang);
          const fieldName = t("projects.fields.speciesOther");
          showErr(
            t("projects.errors.speciesOtherRequiredInLang", {
              field: fieldName,
              lang: langLabel,
            })
          );
          return;
        }
      }
    }

    const hasPhotos =
      request.petPhotos?.some((p) => selectedFileIds.includes(p.id)) ||
      newPhotos.length > 0;

    if (hasPhotos && !coverSelection) {
      setConfirmDialog({
        isOpen: true,
        message: t("projects.alerts.noCoverPhoto"),
        variant: "warning",
        onConfirm: executeSubmit,
      });
      return;
    }

    executeSubmit();
  };

  if (!isOpen || !request) return null;

  const preventMinus = (e) => {
    if (e.key === "-" || e.key === "e") {
      e.preventDefault();
    }
  };

  return (
    <>
      {/* PORTALE - Style przeniesione do SCSS (klasy .portal-*-container) */}
      {alert &&
        createPortal(
          <div className="portal-alert-container">
            <Alert
              variant={alert.variant}
              autoClose={5000}
              onClose={() => setAlert(null)}
            >
              {alert.message}
            </Alert>
          </div>,
          document.body
        )}

      {confirmDialog.isOpen &&
        createPortal(
          <div className="portal-confirm-container">
            <ConfirmDialog
              isOpen={confirmDialog.isOpen}
              message={confirmDialog.message}
              variant={confirmDialog.variant}
              confirmLabel={t("actions.yes") || "Tak"}
              cancelLabel={t("actions.cancel") || "Anuluj"}
              onConfirm={confirmDialog.onConfirm}
              onCancel={() =>
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
              }
            />
          </div>,
          document.body
        )}

      {/* MODAL */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t("projects.createTitle")}
        size="lg"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              {t("actions.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handlePreSubmit}
              isLoading={isSubmitting}
              icon={<Check size={18} />}
            >
              {t("actions.createProject")}
            </Button>
          </>
        }
      >
        <div className="create-project-form">
          <p className="mb-4 text-muted">{t("projects.createSubtitle")}</p>

          {/* 1. DANE WNIOSKODAWCY */}
          <div className="form-section mb-4">
            <h4 className="full-width mb-0">
              {t("projects.sections.applicantData") ||
                t("requests.sections.applicantData")}
            </h4>
            <div className="form-group">
              <label className="form-label">
                {t("form.fields.applicantType.label")}
              </label>
              <select
                className="form-input"
                value={formData.applicantType}
                onChange={(e) =>
                  handleGlobalChange("applicantType", e.target.value)
                }
              >
                <option value="person">
                  {t("form.fields.applicantType.options.person")}
                </option>
                <option value="organization">
                  {t("form.fields.applicantType.options.organization")}
                </option>
                <option value="vetClinic">
                  {t("form.fields.applicantType.options.vetClinic")}
                </option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t("form.fields.fullName")}</label>
              <input
                className="form-input"
                value={formData.fullName}
                onChange={(e) => handleGlobalChange("fullName", e.target.value)}
              />
            </div>
          </div>

          <hr className="my-4" />

          {/* 2. DANE ZWIERZAKA */}
          <div className="form-section mb-4">
            <h4 className="full-width mb-0">
              {t("projects.sections.basicData")}
            </h4>
            <div className="form-group">
              <label className="form-label">
                {t("projects.fields.animalName")}
              </label>
              <input
                className="form-input"
                value={formData.animalName}
                onChange={(e) =>
                  handleGlobalChange("animalName", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("projects.fields.species")}
              </label>
              <select
                className="form-input"
                value={formData.species}
                onChange={(e) => handleGlobalChange("species", e.target.value)}
              >
                <option value="rat">
                  {t("form.fields.species.options.rat")}
                </option>
                <option value="guineaPig">
                  {t("form.fields.species.options.guineaPig")}
                </option>
                <option value="other">
                  {t("form.fields.species.options.other")}
                </option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("projects.fields.animalsCount")}
              </label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.animalsCount}
                onChange={(e) =>
                  handleGlobalChange("animalsCount", e.target.value)
                }
                onKeyDown={preventMinus}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("projects.fields.city")}</label>
              <input
                className="form-input"
                value={formData.city}
                onChange={(e) => handleGlobalChange("city", e.target.value)}
              />
            </div>
          </div>

          {/* 3. KONFIGURACJA */}
          <div className="configuration-box">
            <h4>{t("projects.sections.configuration")}</h4>
            <div className="form-group full-width">
              <label className="form-label">{t("projects.fields.slug")}</label>
              <input
                className="form-input font-mono"
                value={formData.slug}
                onChange={(e) => {
                  handleGlobalChange("slug", e.target.value);
                  setIsSlugManuallyEdited(true);
                }}
              />
              <span className="slug-hint">
                {t("projects.fields.slugHint", { slug: formData.slug })}
              </span>
            </div>
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isUrgent"
                checked={formData.isUrgent}
                onChange={(e) =>
                  handleGlobalChange("isUrgent", e.target.checked)
                }
              />
              <label htmlFor="isUrgent" className="form-label">
                <AlertTriangle size={14} className="urgent-icon" />
                {t("projects.fields.isUrgent")}
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("projects.fields.status")}
              </label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => handleGlobalChange("status", e.target.value)}
              >
                <option value="draft">
                  {t("projects.fields.statusOptions.draft")}
                </option>
                <option value="active">
                  {t("projects.fields.statusOptions.active")}
                </option>
              </select>
            </div>
          </div>

          <hr />

          {/* 4. TREŚCI */}
          <h4 className="mb-3">{t("projects.sections.content")}</h4>
          <div className="tabs-language mb-4">
            {["pl", "en", "es"].map((lang) => (
              <button
                key={lang}
                className={`tab-lang-btn ${
                  activeLang === lang ? "active" : ""
                }`}
                onClick={() => setActiveLang(lang)}
              >
                {lang.toUpperCase()}{" "}
                {formData.description[lang] && <span className="dot" />}
              </button>
            ))}
          </div>
          <div className="form-section">
            <div className="form-group full-width">
              <label className="form-label">
                {t("projects.fields.title")} ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.title[activeLang]}
                onChange={(e) => handleTransChange("title", e.target.value)}
                placeholder={t("projects.fields.titlePlaceholder")}
              />
            </div>
            <div className="form-group full-width">
              <label className="form-label">
                {t("projects.fields.description")} ({activeLang.toUpperCase()})
              </label>
              <textarea
                className="form-textarea"
                value={formData.description[activeLang]}
                onChange={(e) =>
                  handleTransChange("description", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("projects.fields.country")} ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.country[activeLang]}
                onChange={(e) => handleTransChange("country", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("projects.fields.age")} ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.age[activeLang]}
                onChange={(e) => handleTransChange("age", e.target.value)}
              />
            </div>
            {formData.species === "other" && (
              <div className="form-group">
                <label className="form-label">
                  {t("projects.fields.speciesOther")} (
                  {activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.speciesOther[activeLang]}
                  onChange={(e) =>
                    handleTransChange("speciesOther", e.target.value)
                  }
                />
              </div>
            )}
          </div>

          <hr className="my-4" />

          {/* 5. FINANSE */}
          <h4 className="mb-3">{t("projects.sections.finance")}</h4>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">
                {t("projects.fields.amountTarget")}
              </label>
              <div className="amount-row">
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={formData.amountTarget}
                  onChange={(e) =>
                    handleGlobalChange("amountTarget", e.target.value)
                  }
                  onKeyDown={preventMinus}
                />
                <select
                  className="form-input currency-select"
                  value={formData.currency}
                  onChange={(e) =>
                    handleGlobalChange("currency", e.target.value)
                  }
                >
                  <option value="EUR">EUR</option>
                  <option value="PLN">PLN</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("projects.fields.deadline")}
              </label>
              <input
                type="date"
                className="form-input"
                value={formData.deadline}
                onChange={(e) => handleGlobalChange("deadline", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("projects.fields.amountCollected")}
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.amountCollected}
                onChange={(e) =>
                  handleGlobalChange("amountCollected", e.target.value)
                }
                onKeyDown={preventMinus}
              />
            </div>
          </div>

          <hr className="my-4" />
          <h4 className="mb-4">{t("projects.sections.media")}</h4>

          {/* --- 6. ZDJĘCIA --- */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <label className="section-label mb-0">
              {t("form.fields.photos")}
            </label>
            <label className="btn-upload">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleAddPhotos}
                hidden
              />
              <ImageIcon size={16} /> {t("actions.addPhotos")}
            </label>
          </div>

          <div className="cover-selection-grid">
            {request.petPhotos?.map((photo) => {
              const isSelected = selectedFileIds.includes(photo.id);
              const isCover =
                coverSelection?.type === "existing" &&
                coverSelection.id === photo.id;
              return (
                <div
                  key={photo.id}
                  className={`cover-option ${isCover ? "selected" : ""} ${
                    !isSelected ? "opacity-50" : ""
                  }`}
                  onClick={() => handleSetCover("existing", photo.id)}
                >
                  <img src={photo.url} alt="existing" />
                  {isCover && (
                    <div className="overlay">
                      <Check size={24} color="white" />
                    </div>
                  )}
                  <div
                    className="checkbox-overlay"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExistingFile(photo.id);
                    }}
                  >
                    <input type="checkbox" checked={isSelected} readOnly />
                  </div>
                </div>
              );
            })}

            {newPhotos.map((photo) => {
              const isCover =
                coverSelection?.type === "new" &&
                coverSelection.id === photo.id;
              return (
                <div
                  key={photo.id}
                  className={`cover-option ${isCover ? "selected" : ""}`}
                  onClick={() => handleSetCover("new", photo.id)}
                >
                  <img src={photo.url} alt="new" />
                  {isCover && (
                    <div className="overlay">
                      <Check size={24} color="white" />
                    </div>
                  )}
                  <div
                    className="delete-overlay"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNewPhoto(photo.id);
                    }}
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* --- 7. DOKUMENTY --- */}
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <label className="section-label mb-0">
                {t("form.fields.documents")}
              </label>
              <label className="btn-upload">
                <input
                  type="file"
                  multiple
                  onChange={handleAddDocuments}
                  hidden
                />
                <Paperclip size={16} /> {t("actions.addDocuments")}
              </label>
            </div>

            <div className="documents-list">
              {request.documents?.map((doc) => {
                const isSelected = selectedFileIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    className={`document-item ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleExistingFile(doc.id)}
                  >
                    <input
                      type="checkbox"
                      className="doc-checkbox"
                      checked={isSelected}
                      readOnly
                    />
                    <FileText size={20} color="#6b7280" />
                    <span className="doc-name">{doc.originalName}</span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download size={16} />
                    </a>
                  </div>
                );
              })}

              {newDocuments.map((doc) => (
                <div key={doc.id} className="document-item new-file">
                  <div className="doc-icon-wrapper">
                    <Upload size={16} color="#3b82f6" />
                  </div>
                  <FileText size={20} color="#3b82f6" />
                  <span className="doc-name" style={{ color: "#1e3a8a" }}>
                    {doc.file.name}
                    <span className="doc-size-text"></span>
                  </span>
                  <button
                    className="btn-trash"
                    onClick={() => removeNewDocument(doc.id)}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </button>
                </div>
              ))}

              {request.documents?.length === 0 && newDocuments.length === 0 && (
                <p className="text-muted empty-docs-msg">-</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CreateProjectModal;
