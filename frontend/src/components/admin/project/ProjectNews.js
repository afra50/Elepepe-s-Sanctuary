import React, { useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Calendar } from "lucide-react";
import Button from "../../ui/Button";
import { formatDate } from "../../../utils/dateUtils";
import { useTranslation } from "react-i18next";

const ProjectNews = ({ news = [], onAddNews, onEditNews, onDeleteNews }) => {
  const { i18n } = useTranslation();

  return (
    <div className="news-section card mt-4">
      <div className="section-header-row">
        <h3 className="section-title">Aktualności (Newsy)</h3>
        <Button size="sm" icon={<Plus size={16} />} onClick={onAddNews}>
          Dodaj aktualność
        </Button>
      </div>

      <div className="news-list">
        {news.length === 0 ? (
          <p className="text-muted">Brak aktualności dla tej zbiórki.</p>
        ) : (
          news.map((item) => (
            <div key={item.id} className="news-item">
              <div className="news-header">
                <div className="news-meta">
                  <span className="news-date">
                    <Calendar size={14} />{" "}
                    {formatDate(item.createdAt, i18n.language)}
                  </span>
                  {item.isVisible ? (
                    <span className="status-visible">
                      <Eye size={12} /> Publiczny
                    </span>
                  ) : (
                    <span className="status-hidden">
                      <EyeOff size={12} /> Ukryty
                    </span>
                  )}
                </div>
                <div className="news-actions">
                  <button
                    className="action-btn"
                    onClick={() => onEditNews(item)}
                    title="Edytuj"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="action-btn btn-delete"
                    onClick={() => onDeleteNews(item.id)}
                    title="Usuń"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h4 className="news-title">{item.title}</h4>
              <p className="news-content-preview">
                {item.content.length > 150
                  ? item.content.substring(0, 150) + "..."
                  : item.content}
              </p>

              {/* Opcjonalnie: Licznik zdjęć */}
              {item.files?.length > 0 && (
                <div className="news-files-badge">
                  +{item.files.length} zdjęć
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectNews;
