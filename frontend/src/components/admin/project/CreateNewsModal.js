import React, { useState, useEffect, useRef } from "react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon, Trash2, Paperclip } from "lucide-react";

const CreateNewsModal = ({ isOpen, onClose, newsToEdit, onSave, isSaving }) => {
  const { t } = useTranslation("admin");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isVisible: true,
    files: [],
  });

  const [existingFiles, setExistingFiles] = useState([]);

  useEffect(() => {
    if (newsToEdit) {
      setFormData({
        title: newsToEdit.title || "",
        content: newsToEdit.content || "",
        isVisible: newsToEdit.isVisible ?? true,
        files: [],
      });
      setExistingFiles(newsToEdit.files || []);
    } else {
      setFormData({ title: "", content: "", isVisible: true, files: [] });
      setExistingFiles([]);
    }
  }, [newsToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler dla Checkboxa (Twój komponent zwraca value jako boolean)
  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      isVisible: checked,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...files],
      }));
    }
    e.target.value = ""; // Reset inputa
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeNewFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert("Tytuł jest wymagany"); // Możesz użyć customowego alerta
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
      title={newsToEdit ? "Edytuj aktualność" : "Nowa aktualność"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSaving}>
            {newsToEdit ? "Zapisz zmiany" : "Dodaj"}
          </Button>
        </>
      }
    >
      <div className="form-field">
        <label htmlFor="newsTitle">Tytuł</label>
        <input
          id="newsTitle"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Wpisz nagłówek..."
        />
      </div>

      <div className="form-field">
        <label htmlFor="newsContent">Treść</label>
        <textarea
          id="newsContent"
          name="content"
          rows={5}
          value={formData.content}
          onChange={handleChange}
          placeholder="Co słychać u zwierzaka?"
        />
      </div>

      <div className="form-field">
        <Checkbox
          name="isVisible"
          checked={formData.isVisible}
          onChange={handleCheckboxChange}
        >
          Widoczny publicznie
        </Checkbox>
      </div>

      {/* SEKCJA PLIKÓW */}
      <div className="mt-4">
        <div className="btn-upload-wrapper">
          <Button
            variant="ghost"
            size="sm"
            icon={<Paperclip size={16} />} // Ikona spinacza sugeruje wszystkie pliki
            onClick={handleUploadClick}
          >
            Dodaj pliki do wpisu
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            // Usunięto accept="image/*" aby pozwolić na wszystkie pliki
            onChange={handleFileChange}
            hidden
          />
        </div>

        {/* Lista nowych plików */}
        {formData.files.length > 0 && (
          <ul className="file-list mt-2">
            {formData.files.map((file, idx) => (
              <li key={idx} className="file-list__item">
                <span className="file-list__dot"></span>
                <span className="file-list__name">{file.name}</span>
                <div className="file-list__actions">
                  <button
                    type="button"
                    className="file-list__btn file-list__btn--remove"
                    onClick={() => removeNewFile(idx)}
                    title="Usuń"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Lista istniejących plików */}
        {existingFiles.length > 0 && (
          <div className="existing-files-box">
            <p className="text-muted small-text">Istniejące pliki:</p>
            <ul className="file-list">
              {existingFiles.map((file) => (
                <li key={file.id} className="file-list__item">
                  <span className="file-list__dot dot-gray"></span>
                  <span className="file-list__name">
                    {file.original_name || "Plik"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CreateNewsModal;
