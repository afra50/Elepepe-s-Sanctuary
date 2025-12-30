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
  const [formData, setFormData] = useState({
    title: { pl: "", en: "", es: "" },
    content: { pl: "", en: "", es: "" },
    isVisible: true,
  });

  // --- NOWE: JEDNOLITA LISTA PLIKÓW (STARE + NOWE) ---
  // Obiekt pliku: { id, name, isNew, file (dla nowych) }
  const [files, setFiles] = useState([]);

  // Lista ID plików do usunięcia (tylko stare pliki)
  const [filesToDelete, setFilesToDelete] = useState([]);

  // --- INICJALIZACJA DANYCH ---
  useEffect(() => {
    if (isOpen) {
      // Reset
      setFiles([]);
      setFilesToDelete([]);
      setActiveLang("pl");

      if (newsToEdit) {
        // Helper do parsowania JSON
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

        // Mapowanie ISTNIEJĄCYCH plików na wspólny format
        if (newsToEdit.files && Array.isArray(newsToEdit.files)) {
          setFiles(
            newsToEdit.files.map((f) => ({
              id: f.id, // Prawdziwe ID z bazy
              name: f.originalName || f.name,
              isNew: false, // To jest stary plik
            }))
          );
        }
      } else {
        // Reset dla nowego wpisu
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
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, isVisible: checked }));
  };

  // --- NOWA OBSŁUGA PLIKÓW ---

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;

    // Tworzymy obiekty dla nowych plików
    const processedFiles = newFiles.map((file) => ({
      id: `temp-${Math.random().toString(36).substr(2, 9)}`, // Tymczasowe ID
      name: file.name,
      isNew: true,
      file: file, // Fizyczny obiekt File do wysłania
    }));

    setFiles((prev) => [...prev, ...processedFiles]);
    e.target.value = "";
  };

  const removeFile = (id) => {
    const fileToRemove = files.find((f) => f.id === id);
    if (!fileToRemove) return;

    // Jeśli usuwamy STARY plik (z bazy), dodajemy jego ID do listy usuniętych
    if (!fileToRemove.isNew) {
      setFilesToDelete((prev) => [...prev, id]);
    }

    // Usuwamy z widoku
    setFiles((prev) => prev.filter((f) => f.id !== id));
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

    // Przygotowujemy payload.
    // Parent (AdminProjectDetails) zamieni to na FormData.
    const payload = {
      ...formData,
      id: newsToEdit?.id,
      // Przekazujemy tylko obiekty File dla NOWYCH plików
      filesToUpload: files.filter((f) => f.isNew).map((f) => f.file),
      // Przekazujemy listę ID starych plików do usunięcia
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

      {/* SEKCJA PLIKÓW */}
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

        {files.length > 0 && (
          <ul className="file-list mt-2">
            {files.map((file) => (
              <li key={file.id} className="file-list__item">
                <div style={{ display: "flex", alignItems: "center" }}>
                  {/* Opcjonalnie: kropka oznaczająca status (nowy/stary) */}
                  <span
                    className={`file-list__dot ${file.isNew ? "" : "dot-gray"}`}
                  ></span>
                  <span className="file-list__name">{file.name}</span>
                </div>
                <button
                  type="button"
                  className="file-list__btn file-list__btn--remove"
                  onClick={() => removeFile(file.id)}
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
