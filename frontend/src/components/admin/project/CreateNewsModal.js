import React, { useState, useEffect, useRef } from "react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";
import Alert from "../../ui/Alert";
import Loader from "../../ui/Loader";
import { useTranslation } from "react-i18next";
import { Trash2, Paperclip } from "lucide-react";

const CreateNewsModal = ({ isOpen, onClose, newsToEdit, onSave, isSaving }) => {
  const { t } = useTranslation("admin");
  const fileInputRef = useRef(null);

  // --- ZAKŁADKI JĘZYKOWE ---
  const [activeLang, setActiveLang] = useState("pl");
  const languages = ["pl", "en", "es"];

  // --- STAN FORMULARZA ---
  const [formData, setFormData] = useState({
    title: { pl: "", en: "", es: "" },
    content: { pl: "", en: "", es: "" },
    isVisible: true,
  });

  // --- STAN PLIKÓW ---
  const [files, setFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);

  // --- STAN ALERTU LOKALNEGO ---
  const [localAlert, setLocalAlert] = useState(null);

  // --- INICJALIZACJA DANYCH ---
  useEffect(() => {
    if (isOpen) {
      setFiles([]);
      setFilesToDelete([]);
      setActiveLang("pl");
      setLocalAlert(null);

      if (newsToEdit) {
        const parseField = (field) => {
          try {
            return typeof field === "string" ? JSON.parse(field) : field || {};
          } catch (e) {
            return {};
          }
        };

        setFormData({
          title: { pl: "", en: "", es: "", ...parseField(newsToEdit.title) },
          content: {
            pl: "",
            en: "",
            es: "",
            ...parseField(newsToEdit.content),
          },
          isVisible: newsToEdit.isVisible ?? true,
        });

        if (newsToEdit.files && Array.isArray(newsToEdit.files)) {
          setFiles(
            newsToEdit.files.map((f) => ({
              id: f.id,
              name: f.originalName || f.name,
              isNew: false,
            }))
          );
        }
      } else {
        setFormData({
          title: { pl: "", en: "", es: "" },
          content: { pl: "", en: "", es: "" },
          isVisible: true,
        });
      }
    }
  }, [newsToEdit, isOpen]);

  // --- HANDLERY ---

  const handleTextChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [activeLang]: value,
      },
    }));
    if (localAlert) setLocalAlert(null);
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, isVisible: checked }));
  };

  const MAX_FILES = 10; // Stała zgodna z backendem

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;

    // Sprawdź, czy po dodaniu nie przekroczymy limitu
    // Liczymy tylko pliki, które aktualnie są na liście (files.length) + nowe
    if (files.length + newFiles.length > MAX_FILES) {
      setLocalAlert({
        variant: "error",
        message: `Możesz dodać maksymalnie ${MAX_FILES} plików.`, // Dodaj do tłumaczeń: projects.newsModal.errors.maxFiles
      });
      e.target.value = ""; // Reset inputa
      return;
    }

    const processedFiles = newFiles.map((file) => ({
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      isNew: true,
      file: file,
    }));

    setFiles((prev) => [...prev, ...processedFiles]);
    e.target.value = "";

    // Jeśli był jakiś błąd wcześniej, wyczyść go
    if (localAlert) setLocalAlert(null);
  };

  const removeFile = (id) => {
    const fileToRemove = files.find((f) => f.id === id);
    if (!fileToRemove) return;

    if (!fileToRemove.isNew) {
      setFilesToDelete((prev) => [...prev, id]);
    }

    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = () => {
    for (const lang of languages) {
      const title = formData.title[lang];
      const content = formData.content[lang];

      if (!title?.trim() || !content?.trim()) {
        setActiveLang(lang);
        setLocalAlert({
          variant: "error",
          message:
            t("projects.newsModal.errors.allLanguagesRequired", {
              lang: lang.toUpperCase(),
            }) ||
            `Uzupełnij tytuł i treść we wszystkich językach. Brakuje: ${lang.toUpperCase()}`,
        });
        return;
      }
    }

    const payload = {
      ...formData,
      id: newsToEdit?.id,
      filesToUpload: files.filter((f) => f.isNew).map((f) => f.file),
      filesToDelete: filesToDelete,
    };

    onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="create-news-modal"
      title={
        newsToEdit
          ? t("projects.newsModal.editTitle")
          : t("projects.newsModal.createTitle")
      }
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            {t("common.cancel")}
          </Button>

          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <div className="btn-loader-wrapper">
                <Loader size="sm" variant="inline" />
              </div>
            ) : newsToEdit ? (
              t("common.save")
            ) : (
              t("common.add")
            )}
          </Button>
        </>
      }
    >
      {/* ALERT BŁĘDÓW */}
      {localAlert && (
        <div className="mb-4">
          <Alert
            variant={localAlert.variant}
            onClose={() => setLocalAlert(null)}
          >
            {localAlert.message}
          </Alert>
        </div>
      )}

      {/* ZAKŁADKI JĘZYKOWE */}
      <div className="lang-tabs-simple mb-3">
        {languages.map((code) => (
          <button
            key={code}
            className={`lang-tab-btn ${activeLang === code ? "active" : ""}`}
            onClick={() => setActiveLang(code)}
          >
            <img
              src={`/flags/${code}.svg`}
              alt={code}
              className="tab-flag-sm"
              onError={(e) => (e.target.style.display = "none")}
            />
            {code.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="form-field">
        <label htmlFor="newsTitle">
          {t("projects.newsModal.fields.title")} ({activeLang.toUpperCase()})
        </label>
        <input
          id="newsTitle"
          type="text"
          value={formData.title[activeLang] || ""}
          onChange={(e) => handleTextChange("title", e.target.value)}
          placeholder={`${t(
            "projects.newsModal.placeholders.title"
          )} (${activeLang})`}
          disabled={isSaving}
        />
      </div>

      <div className="form-field">
        <label htmlFor="newsContent">
          {t("projects.newsModal.fields.content")} ({activeLang.toUpperCase()})
        </label>
        <textarea
          id="newsContent"
          rows={5}
          value={formData.content[activeLang] || ""}
          onChange={(e) => handleTextChange("content", e.target.value)}
          placeholder={`${t(
            "projects.newsModal.placeholders.content"
          )} (${activeLang})`}
          disabled={isSaving}
        />
      </div>

      <div className="form-field">
        <Checkbox
          name="isVisible"
          checked={formData.isVisible}
          onChange={handleCheckboxChange}
          disabled={isSaving}
        >
          {t("projects.newsModal.fields.isVisible")}
        </Checkbox>
      </div>

      {/* SEKCJA PLIKÓW */}
      <div className="mt-4">
        <div className="btn-upload-wrapper">
          <Button
            variant="ghost"
            size="sm"
            icon={<Paperclip size={16} />}
            onClick={() => fileInputRef.current?.click()}
            // Zablokuj, jeśli zapisuje LUB jeśli osiągnięto limit plików
            disabled={isSaving || files.length >= 10}
          >
            {files.length >= 10
              ? "Limit plików osiągnięty" // projects.newsModal.limitReached
              : t("projects.newsModal.addFiles")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            hidden
          />
        </div>

        {files.length > 0 ? (
          <ul className="file-list mt-2">
            {files.map((file) => (
              <li key={file.id} className="file-list__item">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    className={`file-list__dot ${file.isNew ? "" : "dot-gray"}`}
                  ></span>
                  <span className="file-list__name">{file.name}</span>
                </div>
                <button
                  type="button"
                  className="file-list__btn file-list__btn--remove"
                  onClick={() => removeFile(file.id)}
                  disabled={isSaving}
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          // Wyświetl komunikat, jeśli brak plików
          <p>{t("projects.news.noFiles")}</p>
        )}
      </div>
    </Modal>
  );
};

export default CreateNewsModal;
