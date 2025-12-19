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
import Button from "../../ui/Button"; // Twój komponent Button

const ProjectMedia = ({ files, onFilesChange }) => {
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

  // Oznaczanie jako usunięte (soft delete)
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

  // Przywracanie pliku
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
          <h3 className="section-title title-no-border">Galeria i Pliki</h3>
          <p className="section-subtitle">
            Zarządzaj zdjęciami i dokumentami zbiórki.
          </p>
        </div>
      </div>

      {/* --- SEKCJA ZDJĘĆ --- */}
      <div className="mb-4">
        <div className="upload-header">
          <label className="section-label-bold">
            Zdjęcia ({photos.filter((p) => !p.isDeleted).length})
          </label>

          {/* Przycisk dodawania zdjęć (Button) */}
          <Button
            variant="ghost"
            size="sm"
            icon={<ImageIcon size={16} />}
            onClick={handleAddPhotosClick}
          >
            Dodaj zdjęcia
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
                    ? "Plik oznaczony do usunięcia"
                    : "Kliknij, aby ustawić jako okładkę"
                }
              >
                <img src={file.url} alt="media" />

                {file.isNew && !file.isDeleted && (
                  <div className="new-badge">NOWE</div>
                )}

                {!file.isDeleted ? (
                  <>
                    {file.isCover ? (
                      <div className="cover-badge">
                        <Star size={10} fill="white" strokeWidth={0} />
                        <span>Miniatura</span>
                      </div>
                    ) : (
                      <div className="cover-hover-hint">
                        Ustaw jako miniaturę
                      </div>
                    )}

                    <button
                      className="file-preview__remove"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsDeleted(file.id);
                      }}
                      title="Usuń"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                ) : (
                  <div className="deleted-overlay">
                    <span className="deleted-text">USUNIĘTE</span>
                    <button
                      type="button"
                      className="btn-restore"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreFile(file.id);
                      }}
                      title="Przywróć"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-box">
            Brak zdjęć. Kliknij "Dodaj zdjęcia", aby wgrać.
          </div>
        )}
      </div>

      {/* --- SEKCJA DOKUMENTÓW --- */}
      <div className="documents-list-container">
        <div className="upload-header">
          <label className="docs-title-header">
            Dokumenty ({documents.filter((d) => !d.isDeleted).length})
          </label>

          {/* Przycisk dodawania dokumentów (Button) */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Paperclip size={16} />}
            onClick={handleAddDocumentsClick}
          >
            Dodaj dokumenty
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
                    {doc.originalName || doc.file?.name || "Dokument bez nazwy"}
                  </span>
                  {doc.isNew && !doc.isDeleted && (
                    <span className="badge-new">NOWY</span>
                  )}
                  {doc.isDeleted && (
                    <span className="badge-deleted">USUNIĘTE</span>
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
                          title="Pobierz"
                        >
                          <Download size={14} />
                        </a>
                      )}
                      <button
                        className="action-btn btn-delete"
                        onClick={() => handleMarkAsDeleted(doc.id)}
                        title="Usuń"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      className="action-btn btn-restore"
                      onClick={() => handleRestoreFile(doc.id)}
                      title="Przywróć"
                    >
                      <RotateCcw size={14} /> Przywróć
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-box">Brak dokumentów.</div>
        )}
      </div>
    </div>
  );
};

export default ProjectMedia;
