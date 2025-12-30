import React, { useRef } from "react";
import {
  Image as ImageIcon,
  FileText,
  Trash2,
  Star,
  Download,
  Paperclip,
  Upload,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../ui/Button";

const ProjectMedia = ({ files, onFilesChange }) => {
  const { t } = useTranslation("admin");
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Filtrowanie (pokazujemy też usunięte, ale wyszarzone)
  const photos = files?.filter((f) => f.type === "photo") || [];
  const documents = files?.filter((f) => f.type !== "photo") || [];

  // --- HANDLERY ---

  const handleAddPhotosClick = () => {
    photoInputRef.current?.click();
  };

  const handleAddDocumentsClick = () => {
    docInputRef.current?.click();
  };

  const handleAddPhotos = (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;

    const processedFiles = newFiles.map((file) => ({
      file,
      id: `new-${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file),
      type: "photo",
      isNew: true,
      isDeleted: false,
    }));

    onFilesChange([...files, ...processedFiles]);
    e.target.value = "";
  };

  const handleAddDocuments = (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;

    const processedFiles = newFiles.map((file) => ({
      file,
      id: `new-${Math.random().toString(36).substr(2, 9)}`,
      url: null,
      originalName: file.name,
      type: "document",
      isNew: true,
      isDeleted: false,
    }));

    onFilesChange([...files, ...processedFiles]);
    e.target.value = "";
  };

  const handleMarkAsDeleted = (id) => {
    const updatedFiles = files
      .map((f) => {
        if (f.id === id) {
          if (f.isNew) return null; // Nowe usuwamy od razu
          return { ...f, isDeleted: true, isCover: false };
        }
        return f;
      })
      .filter(Boolean);

    onFilesChange(updatedFiles);
  };

  const handleRestoreFile = (id) => {
    const updatedFiles = files.map((f) =>
      f.id === id ? { ...f, isDeleted: false } : f
    );
    onFilesChange(updatedFiles);
  };

  const handleSetCover = (id) => {
    const file = files.find((f) => f.id === id);
    if (file?.isDeleted) return;

    const updatedFiles = files.map((f) => ({
      ...f,
      isCover: f.id === id,
    }));
    onFilesChange(updatedFiles);
  };

  return (
    <div className="media-section card mt-4">
      <div className="section-header-row section-header-media">
        <div>
          <h3 className="section-title title-no-border">
            {t("projects.media.title")}
          </h3>
          <p className="section-subtitle">{t("projects.media.subtitle")}</p>
        </div>
      </div>

      {/* --- SEKCJA ZDJĘĆ --- */}
      <div className="mb-4">
        <div className="upload-header">
          <label className="section-label-bold">
            {t("projects.media.photosLabel")} (
            {photos.filter((p) => !p.isDeleted).length})
          </label>

          <Button
            variant="ghost"
            size="sm"
            icon={<ImageIcon size={16} />}
            onClick={handleAddPhotosClick}
          >
            {t("projects.media.addPhotos")}
          </Button>
          <input
            ref={photoInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleAddPhotos}
            hidden
          />
        </div>

        {photos.length > 0 ? (
          <div className="file-previews">
            {photos.map((file) => (
              <div
                key={file.id}
                className={`file-preview media-item-wrapper ${
                  file.isNew ? "is-new-file" : ""
                } ${file.isDeleted ? "is-deleted" : ""}`}
                onClick={() => !file.isDeleted && handleSetCover(file.id)}
                title={
                  file.isDeleted
                    ? t("projects.media.deletedTooltip")
                    : t("projects.media.setCoverTooltip")
                }
              >
                <img src={file.url} alt="media" />

                {file.isNew && !file.isDeleted && (
                  <div className="new-badge">
                    {t("projects.media.newPhoto")}
                  </div>
                )}

                {!file.isDeleted ? (
                  <>
                    {file.isCover ? (
                      <div className="cover-badge">
                        <Star size={10} fill="white" strokeWidth={0} />
                        <span>{t("projects.media.coverBadge")}</span>
                      </div>
                    ) : (
                      <div className="cover-hover-hint">
                        {t("projects.media.setCoverHint")}
                      </div>
                    )}

                    <button
                      className="file-preview__remove"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsDeleted(file.id);
                      }}
                      title={t("actions.delete")}
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                ) : (
                  <div className="deleted-overlay">
                    <span className="deleted-text">
                      {t("projects.media.deletedBadge")}
                    </span>
                    <button
                      type="button"
                      className="btn-restore"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreFile(file.id);
                      }}
                      title={t("actions.restore")}
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-box">{t("projects.media.noPhotos")}</div>
        )}
      </div>

      {/* --- SEKCJA DOKUMENTÓW --- */}
      <div className="documents-list-container">
        <div className="upload-header">
          <label className="docs-title-header">
            {t("projects.media.documentsLabel")} (
            {documents.filter((d) => !d.isDeleted).length})
          </label>

          <Button
            variant="ghost"
            size="sm"
            icon={<Paperclip size={16} />}
            onClick={handleAddDocumentsClick}
          >
            {t("projects.media.addDocuments")}
          </Button>
          <input
            ref={docInputRef}
            type="file"
            multiple
            onChange={handleAddDocuments}
            hidden
          />
        </div>

        {documents.length > 0 ? (
          <div className="file-list-container">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`document-row-item ${
                  doc.isDeleted ? "is-deleted-row" : ""
                }`}
              >
                <div className="doc-info">
                  {doc.isNew ? (
                    <Upload size={16} className="text-blue" />
                  ) : (
                    <FileText size={16} className="text-gray" />
                  )}
                  <span className="doc-name">
                    {doc.originalName ||
                      doc.file?.name ||
                      t("projects.media.untitledDocument")}
                  </span>
                  {doc.isNew && !doc.isDeleted && (
                    <span className="badge-new">
                      {t("projects.media.newDoc")}
                    </span>
                  )}
                  {doc.isDeleted && (
                    <span className="badge-deleted">
                      {t("projects.media.deletedBadge")}
                    </span>
                  )}
                </div>
                <div className="doc-actions">
                  {!doc.isDeleted ? (
                    <>
                      {!doc.isNew && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn"
                          title={t("actions.download")}
                        >
                          <Download size={14} />
                        </a>
                      )}
                      <button
                        className="action-btn btn-delete"
                        onClick={() => handleMarkAsDeleted(doc.id)}
                        title={t("actions.delete")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      className="action-btn btn-restore"
                      onClick={() => handleRestoreFile(doc.id)}
                      title={t("actions.restore")}
                    >
                      <RotateCcw size={14} /> {t("actions.restore")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-box">
            {t("projects.media.noDocuments")}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMedia;
