import React from "react";
import { Camera, FileText, Trash2, Star } from "lucide-react";
import Button from "../../ui/Button";

const ProjectMedia = ({ files }) => {
  return (
    <div className="media-section card mt-4">
      <div className="section-header-row">
        <h3 className="section-title">Galeria i Pliki</h3>
        <Button size="sm" variant="outline" icon={<Camera size={16} />}>
          Zarządzaj mediami
        </Button>
      </div>

      {/* UŻYCIE KLASY .file-previews Z TWOJEGO form.scss */}
      <div className="file-previews">
        {files && files.length > 0 ? (
          files.map((file) => (
            <div key={file.id} className="file-preview media-item-wrapper">
              {file.type === "photo" ? (
                <img src={file.url} alt="media" />
              ) : (
                // Placeholder dla dokumentów (jeśli nie ma img)
                <div className="doc-placeholder">
                  <FileText size={24} strokeWidth={1.5} />
                </div>
              )}

              {/* Przycisk usuwania (zgodny z Twoim CSS) */}
              <button
                className="file-preview__remove"
                type="button"
                title="Usuń"
              >
                <Trash2 size={12} />
              </button>

              {/* Badge Okładki (Nowy element) */}
              {file.isCover === 1 && (
                <div className="cover-badge" title="Zdjęcie główne">
                  <Star size={10} fill="white" strokeWidth={0} />
                  <span>COVER</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-muted">Brak plików w tej zbiórce.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectMedia;
