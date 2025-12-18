import React from "react";
import { useTranslation } from "react-i18next";
import { Calendar, PawPrint, MapPin, TriangleAlert } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";
// Zakładam, że Twój komponent jest tutaj:
import ProgressBar from "../ui/ProgressBar";

const ProjectCard = ({ project, onClick }) => {
  const { t, i18n } = useTranslation("admin");

  const getTranslatedField = (jsonString) => {
    try {
      const obj =
        typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      return obj?.[i18n.language] || obj?.["pl"] || "";
    } catch (e) {
      return "";
    }
  };

  const displayTitle = getTranslatedField(project.title) || project.animalName;
  const formattedDeadline = formatDate(project.deadline, i18n.language);

  // Szukanie okładki
  const coverPhoto =
    project.files?.find((f) => f.isCover)?.url ||
    project.files?.find((f) => f.type === "photo")?.url;

  return (
    <article className="project-card clickable" onClick={onClick}>
      {/* --- HEADER Z OBRAZKIEM --- */}
      <div className="project-card__header">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={displayTitle}
            className="project-card__img"
          />
        ) : (
          <div className="project-card__placeholder">
            <PawPrint size={32} opacity={0.2} />
          </div>
        )}

        <div className={`project-card__badge status-${project.status}`}>
          {t(`projects.fields.statusOptions.${project.status}`) ||
            project.status}
        </div>

        {project.isUrgent === 1 && (
          <div
            className="project-card__urgent"
            title={t("projects.fields.isUrgent")}
          >
            <TriangleAlert size={14} fill="white" />
          </div>
        )}
      </div>

      {/* --- TREŚĆ --- */}
      <div className="project-card__body">
        <h3 className="project-card__title" title={displayTitle}>
          {displayTitle}
        </h3>

        <div className="project-card__meta">
          <span className="meta-item">
            <MapPin size={14} /> {project.city}
          </span>
          <span className="meta-id">#{project.id}</span>
        </div>

        {/* Twój Progress Bar */}
        <div className="project-card__progress-wrapper">
          <div className="money-labels">
            <span className="collected">
              {project.amountCollected} {project.currency}
            </span>
            <span className="target">
              {" "}
              / {project.amountTarget} {project.currency}
            </span>
          </div>
          <ProgressBar
            current={project.amountCollected}
            goal={project.amountTarget}
          />
        </div>

        <div className="project-card__footer">
          <div className="footer-item">
            <Calendar size={14} />
            <span>{formattedDeadline}</span>
          </div>
          <div className="footer-item">
            <PawPrint size={14} />
            <span>{project.animalName}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
