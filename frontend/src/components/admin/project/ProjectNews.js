import React from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import Button from "../../ui/Button";
import { formatDate } from "../../../utils/dateUtils";
import { useTranslation } from "react-i18next";

const ProjectNews = ({ news = [], onAddNews, onEditNews, onDeleteNews }) => {
  const { t, i18n } = useTranslation("admin");

  // Helper function to extract text in the appropriate language
  const getTrans = (field) => {
    if (!field) return "";

    // 1. If it's already an object (e.g. pre-parsed), use it directly
    if (typeof field === "object") {
      return field[i18n.language] || field["pl"] || "";
    }

    // 2. If it's a string, try to parse it as JSON
    if (typeof field === "string") {
      if (field.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(field);
          return parsed[i18n.language] || parsed["pl"] || "";
        } catch (e) {
          return field;
        }
      }
      return field;
    }

    return "";
  };

  return (
    <div className="news-section card mt-4">
      <div className="section-header-row">
        <h3 className="section-title">{t("projects.news.title")}</h3>
        <Button size="sm" icon={<Plus size={16} />} onClick={onAddNews}>
          {t("projects.news.add")}
        </Button>
      </div>

      <div className="news-list">
        {news.length === 0 ? (
          <p className="text-muted">{t("projects.news.empty")}</p>
        ) : (
          news.map((item) => {
            const title = getTrans(item.title);
            const content = getTrans(item.content);

            return (
              <div key={item.id} className="news-item">
                <div className="news-header">
                  <div className="news-meta">
                    <span className="news-date">
                      <Calendar size={14} />{" "}
                      {formatDate(item.createdAt, i18n.language)}
                    </span>
                    {item.isVisible ? (
                      <span className="status-visible">
                        <Eye size={12} /> {t("projects.news.public")}
                      </span>
                    ) : (
                      <span className="status-hidden">
                        <EyeOff size={12} /> {t("projects.news.hidden")}
                      </span>
                    )}
                  </div>
                  <div className="news-actions">
                    <button
                      className="action-btn"
                      onClick={() => onEditNews(item)}
                      title={t("actions.edit")}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="action-btn btn-delete"
                      onClick={() => onDeleteNews(item.id)}
                      title={t("actions.delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h4 className="news-title">{title}</h4>
                <p className="news-content-preview">
                  {content.length > 150
                    ? content.substring(0, 150) + "..."
                    : content}
                </p>

                {/* --- SEKCJA PLIKÓW (NOWOŚĆ) --- */}
                {item.files && item.files.length > 0 && (
                  <div className="news-attachments">
                    {item.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="attachment-chip"
                        title={file.originalName}
                      >
                        {file.type === "photo" ? (
                          <ImageIcon size={14} className="icon-photo" />
                        ) : (
                          <FileText size={14} className="icon-doc" />
                        )}
                        <span className="file-name">{file.originalName}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjectNews;
