import React, { useState, useEffect, useRef } from "react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";
import { useTranslation } from "react-i18next";
import { Trash2, Paperclip } from "lucide-react";

const CreateNewsModal = ({ isOpen, onClose, newsToEdit, onSave, isSaving }) => {
  const { t } = useTranslation("admin");
  const fileInputRef = useRef(null);

  // --- ZAKŁADKI JĘZYKOWE ---
  const [activeLang, setActiveLang] = useState("pl");
  const languages = ["pl", "en", "es"];

  // --- STAN FORMULARZA ---
  // Teraz title i content to obiekty, a nie stringi
  const [formData, setFormData] = useState({
    title: { pl: "", en: "", es: "" },
    content: { pl: "", en: "", es: "" },
    isVisible: true,
    files: [],
  });

  const [existingFiles, setExistingFiles] = useState([]);

  // --- INICJALIZACJA DANYCH ---
  useEffect(() => {
    if (newsToEdit) {
      // Helper do parsowania JSON, jeśli przyjdzie string z bazy
      const parseField = (field) => {
        try {
          return typeof field === "string" ? JSON.parse(field) : field || {};
        } catch (e) {
          return {};
        }
      };

      setFormData({
        title: { pl: "", en: "", es: "", ...parseField(newsToEdit.title) },
        content: { pl: "", en: "", es: "", ...parseField(newsToEdit.content) },
        isVisible: newsToEdit.isVisible ?? true,
        files: [],
      });
      setExistingFiles(newsToEdit.files || []);
    } else {
      // Reset dla nowego wpisu
      setFormData({
        title: { pl: "", en: "", es: "" },
        content: { pl: "", en: "", es: "" },
        isVisible: true,
        files: [],
      });
      setExistingFiles([]);
    }
  }, [newsToEdit, isOpen]);

  // --- HANDLERY ---

  // Zmiana tekstu w konkretnym języku
  const handleTextChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [activeLang]: value,
      },
    }));
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, isVisible: checked }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...files],
      }));
    }
    e.target.value = "";
  };

  const removeNewFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    // Walidacja: wymagany tytuł chociaż w języku PL
    if (!formData.title.pl.trim()) {
      alert(
        t("projects.newsModal.errors.titleRequired") ||
          "Tytuł (PL) jest wymagany"
      );
      return;
    }

    onSave({
      ...formData,
      id: newsToEdit?.id,
    });
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
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSaving}>
            {newsToEdit ? t("common.save") : t("common.add")}
          </Button>
        </>
      }
    >
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
        />
      </div>

      <div className="form-field">
        <Checkbox
          name="isVisible"
          checked={formData.isVisible}
          onChange={handleCheckboxChange}
        >
          {t("projects.newsModal.fields.isVisible")}
        </Checkbox>
      </div>

      {/* SEKCJA PLIKÓW (Bez zmian) */}
      <div className="mt-4">
        <div className="btn-upload-wrapper">
          <Button
            variant="ghost"
            size="sm"
            icon={<Paperclip size={16} />}
            onClick={() => fileInputRef.current?.click()}
          >
            {t("projects.newsModal.addFiles")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            hidden
          />
        </div>

        {formData.files.length > 0 && (
          <ul className="file-list mt-2">
            {formData.files.map((file, idx) => (
              <li key={idx} className="file-list__item">
                <span className="file-list__name">{file.name}</span>
                <button
                  type="button"
                  className="file-list__btn file-list__btn--remove"
                  onClick={() => removeNewFile(idx)}
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default CreateNewsModal;
