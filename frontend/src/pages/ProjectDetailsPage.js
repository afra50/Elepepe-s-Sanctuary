import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Calendar,
  User,
  Heart,
  FileText,
  AlertTriangle,
  Clock,
  Share2,
  Sparkles,
} from "lucide-react";

import api from "../utils/api";
import Loader from "../components/ui/Loader";
import ErrorState from "../components/ui/ErrorState";
import Button from "../components/ui/Button"; // Zakładam, że masz ten komponent
import ProgressBar from "../components/ui/ProgressBar";

function ProjectDetailsPage() {
  const { slug } = useParams();
  const { i18n, t } = useTranslation("projectDetails");
  const lang = i18n.language || "pl";

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [activeImage, setActiveImage] = useState(null);

  const isCompleted = project?.status === "completed";

  useEffect(() => {
    setLoading(true);
    setError(false);

    api
      .get(`/projects/${slug}`)
      .then((res) => {
        setProject(res.data);
      })
      .catch((err) => {
        console.error("Failed to load project", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (project?.gallery?.cover) {
      setActiveImage(project.gallery.cover);
    }
  }, [project]);

  // --- Helpery ---
  const calculateProgress = (collected, target) => {
    if (!target || target <= 0) return 0;
    const percent = (collected / target) * 100;
    return Math.min(Math.round(percent), 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(lang, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSpeciesLabel = (animal, lang) => {
    if (!animal) return "";

    if (animal.species === "other") {
      return animal.speciesOther?.[lang] || animal.speciesOther?.pl || "";
    }

    const map = {
      rat: {
        pl: "Szczur",
        en: "Rat",
        es: "Rata",
      },
      guineaPig: {
        pl: "Świnka morska",
        en: "Guinea pig",
        es: "Cobaya",
      },
    };

    return map[animal.species]?.[lang] || map[animal.species]?.pl || "";
  };

  const handleDonate = () => {
    // Tu logika przekierowania do płatności lub scroll do formularza
    console.log("Donate clicked for", project?.id);
  };

  if (loading) return <Loader variant="center" size="lg" />;

  if (error) {
    return (
      <ErrorState
        title={t("error.title")}
        message={t("error.message")}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!project) return null;

  // Obliczenia
  const progress = calculateProgress(
    project.finance.collected,
    project.finance.target
  );
  const title = project.title?.[lang] || project.title?.["pl"];
  const description =
    project.description?.[lang] || project.description?.["pl"];
  const animalName = project.animal.name;
  const applicantName = project.applicant?.name;

  return (
    <main className="project-details-page">
      {/* Tło nagłówka (opcjonalne, np. rozmyte zdjęcie) */}
      <div
        className="project-bg-blur"
        style={{ backgroundImage: `url(${project.gallery.cover})` }}
      ></div>

      <div className="container project-grid">
        {/* === LEWA KOLUMNA: TREŚĆ === */}
        <div className="left-column">
          {/* Header */}
          <header className="project-header">
            <div className="badges">
              {project.isUrgent && (
                <span className="badge badge--urgent">
                  <AlertTriangle size={14} /> {t("urgent")}
                </span>
              )}
              <span className="badge badge--category">
                {getSpeciesLabel(project.animal, lang)}
              </span>
            </div>

            <h1 className="project-title">{title}</h1>

            {isCompleted && (
              <div className="completed-banner">
                <Heart size={18} />
                <span>{t("completed.banner")}</span>
              </div>
            )}

            <div className="project-meta">
              <span className="meta-item">
                <User size={16} /> {applicantName}
              </span>
              {project.location?.city && (
                <span className="meta-item">
                  <MapPin size={16} /> {project.location.city}
                </span>
              )}
              <span className="meta-item">
                <Clock size={16} /> {formatDate(project.finance.deadline)}
              </span>
            </div>
          </header>

          {/* Galeria (Cover + Miniatury) */}
          <div className="project-gallery">
            <div className="cover-image-wrapper">
              <img
                key={activeImage}
                src={activeImage}
                alt={title}
                className="cover-image"
              />
            </div>
            {project.gallery.photos.length > 0 && (
              <div className="gallery-thumbs">
                {project.gallery.photos.slice(0, 4).map((url, idx) => (
                  <div
                    key={idx}
                    className={`thumb ${activeImage === url ? "active" : ""}`}
                    style={{ backgroundImage: `url(${url})` }}
                    onClick={() => setActiveImage(url)}
                  />
                ))}
                {project.gallery.photos.length > 4 && (
                  <div className="thumb more-count">
                    +{project.gallery.photos.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opis */}
          <section className="project-section description-section">
            <h2>{t("sections.about")}</h2>
            <div className="description-content">
              {/* Proste renderowanie nowych linii */}
              {description.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </section>

          {/* Dane podopiecznego (Tabela/Grid) */}
          <section className="project-section animal-info-section">
            <h3>{t("sections.animal")}</h3>
            <div className="animal-card">
              <div className="info-row">
                <span className="label">{t("animal.name")}:</span>
                <span className="value">{animalName}</span>
              </div>
              <div className="info-row">
                <span className="label">{t("animal.species")}:</span>
                <span className="value">
                  {project.animal.speciesOther?.[lang] ||
                    project.animal.species}
                </span>
              </div>
              <div className="info-row">
                <span className="label">{t("animal.age")}:</span>
                <span className="value">
                  {project.animal.age?.[lang] || "-"}
                </span>
              </div>
            </div>
          </section>

          {/* Dokumenty */}
          {project.gallery.documents.length > 0 && (
            <section className="project-section documents-section">
              <h3>{t("sections.documents")}</h3>
              <ul className="docs-list">
                {project.gallery.documents.map((doc, idx) => (
                  <li key={idx}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="doc-link"
                    >
                      <FileText size={18} />
                      <span>{doc.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Aktualności */}
          <section className="project-section updates-section">
            <h3>
              {t("sections.updates")} ({project.updates.length})
            </h3>
            <div className="updates-timeline">
              {project.updates.length === 0 ? (
                <p className="no-updates">{t("sections.noUpdates")}</p>
              ) : (
                project.updates.map((u) => (
                  <article key={u.id} className="update-card">
                    <div className="update-date">
                      <Calendar size={14} /> {formatDate(u.publishedAt)}
                    </div>
                    <h4 className="update-title">{u.title?.[lang]}</h4>
                    <p className="update-content">{u.content?.[lang]}</p>

                    {u.files?.length > 0 && (
                      <>
                        {/* ZDJĘCIA */}
                        {u.files.some((f) => f.type === "photo") && (
                          <div className="update-images">
                            {u.files
                              .filter((f) => f.type === "photo")
                              .map((file, idx) => (
                                <img
                                  key={idx}
                                  src={file.url}
                                  alt=""
                                  className="update-image"
                                  loading="lazy"
                                />
                              ))}
                          </div>
                        )}

                        {/* DOKUMENTY (PDF itp.) */}
                        {u.files.some((f) => f.type !== "photo") && (
                          <ul className="update-docs">
                            {u.files
                              .filter((f) => f.type !== "photo")
                              .map((file, idx) => (
                                <li key={idx}>
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="doc-link"
                                  >
                                    <FileText size={18} />
                                    <span>{file.name}</span>
                                  </a>
                                </li>
                              ))}
                          </ul>
                        )}
                      </>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        {/* === PRAWA KOLUMNA: SIDEBAR (Sticky) === */}
        <div className="right-column">
          <div className="donation-card sticky-card">
            {isCompleted ? (
              <div className="completed-sidebar">
                <div className="completed-icon">
                  <Heart size={28} />
                </div>

                <h3>{t("completed.title")}</h3>
                <p>{t("completed.description")}</p>

                {/* NOWA SEKCJA */}
                <div className="completed-progress">
                  <div className="completed-amounts">
                    <strong>
                      {project.finance.collected} {project.finance.currency}
                    </strong>
                    <span>
                      {t("completed.of")} {project.finance.target}{" "}
                      {project.finance.currency}
                    </span>
                  </div>

                  <ProgressBar
                    current={project.finance.collected}
                    goal={project.finance.target}
                  />

                  {project.finance.collected >= project.finance.target ? (
                    <div className="completed-note completed-note--success">
                      <Sparkles size={14} />
                      <span>{t("completed.goalReached")}</span>
                    </div>
                  ) : (
                    <div className="completed-note">
                      {t("completed.endedBeforeGoal")}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="md"
                  className="btn-share-full"
                  icon={<Share2 size={18} />}
                >
                  {t("actions.share")}
                </Button>
              </div>
            ) : (
              <>
                {/* Pasek postępu */}
                <div className="progress-container">
                  <div className="progress-labels">
                    <span className="collected">
                      {project.finance.collected} {project.finance.currency}
                    </span>
                    <span className="target">
                      z {project.finance.target} {project.finance.currency}
                    </span>
                  </div>
                  <ProgressBar
                    current={project.finance.collected}
                    goal={project.finance.target}
                  />
                  <div className="progress-info">
                    <span>
                      <strong>{progress}%</strong> {t("target")}
                    </span>
                    {/* Opcjonalnie: liczba wpłat jeśli API zwraca */}
                  </div>
                </div>

                <div className="actions">
                  <Button
                    variant="primary"
                    size="lg"
                    className="btn-donate-full"
                    onClick={handleDonate}
                    icon={<Heart size={20} fill="currentColor" />}
                  >
                    {t("actions.donate")}
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    className="btn-share-full"
                    icon={<Share2 size={18} />}
                  >
                    {t("actions.share")}
                  </Button>
                </div>

                <div className="organizer-mini">
                  <small>{project.applicant.label?.[lang]}:</small>
                  <div className="organizer-name">{applicantName}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {!isCompleted && (
        <div className="mobile-donate-bar">
          <Button
            variant="primary"
            size="lg"
            className="mobile-donate-btn"
            onClick={handleDonate}
            icon={<Heart size={20} fill="currentColor" />}
          >
            {t("actions.donate")}
          </Button>
        </div>
      )}
    </main>
  );
}

export default ProjectDetailsPage;
