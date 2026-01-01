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
} from "lucide-react";

import api from "../utils/api";
import Loader from "../components/ui/Loader";
import ErrorState from "../components/ui/ErrorState";
import Button from "../components/ui/Button"; // Zakładam, że masz ten komponent

function ProjectDetailsPage() {
  const { slug } = useParams();
  const { i18n, t } = useTranslation(); // Zakładam namespace 'projects' lub 'common'
  const lang = i18n.language || "pl";

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  const handleDonate = () => {
    // Tu logika przekierowania do płatności lub scroll do formularza
    console.log("Donate clicked for", project?.id);
  };

  if (loading) return <Loader variant="center" size="lg" />;

  if (error) {
    return (
      <ErrorState
        title="Nie udało się załadować zbiórki"
        message="Spróbuj ponownie za chwilę."
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
                  <AlertTriangle size={14} /> PILNE
                </span>
              )}
              <span className="badge badge--category">
                {project.animal.species === "rat" ? "Szczurek" : "Zwierzę"}
              </span>
            </div>

            <h1 className="project-title">{title}</h1>

            <div className="project-meta">
              <span className="meta-item">
                <User size={16} /> {applicantName}
              </span>
              <span className="meta-item">
                <MapPin size={16} /> {project.location.city}
              </span>
              <span className="meta-item">
                <Clock size={16} /> {formatDate(project.finance.deadline)}
              </span>
            </div>
          </header>

          {/* Galeria (Cover + Miniatury) */}
          <div className="project-gallery">
            <div className="cover-image-wrapper">
              <img
                src={project.gallery.cover}
                alt={title}
                className="cover-image"
              />
            </div>
            {project.gallery.photos.length > 0 && (
              <div className="gallery-thumbs">
                {project.gallery.photos.slice(0, 4).map((url, idx) => (
                  <div
                    key={idx}
                    className="thumb"
                    style={{ backgroundImage: `url(${url})` }}
                  ></div>
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
            <h2>O zbiórce</h2>
            <div className="description-content">
              {/* Proste renderowanie nowych linii */}
              {description.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </section>

          {/* Dane podopiecznego (Tabela/Grid) */}
          <section className="project-section animal-info-section">
            <h3>Komu pomagasz?</h3>
            <div className="animal-card">
              <div className="info-row">
                <span className="label">Imię:</span>
                <span className="value">{animalName}</span>
              </div>
              <div className="info-row">
                <span className="label">Gatunek:</span>
                <span className="value">
                  {project.animal.speciesOther?.[lang] ||
                    project.animal.species}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Wiek:</span>
                <span className="value">
                  {project.animal.age?.[lang] || "-"}
                </span>
              </div>
            </div>
          </section>

          {/* Dokumenty */}
          {project.gallery.documents.length > 0 && (
            <section className="project-section documents-section">
              <h3>Dokumenty i Faktury</h3>
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
            <h3>Aktualności ({project.updates.length})</h3>
            <div className="updates-timeline">
              {project.updates.length === 0 ? (
                <p className="no-updates">
                  Brak aktualności. Bądź pierwszą osobą, która wesprze!
                </p>
              ) : (
                project.updates.map((u) => (
                  <article key={u.id} className="update-card">
                    <div className="update-date">
                      <Calendar size={14} /> {formatDate(u.publishedAt)}
                    </div>
                    <h4 className="update-title">{u.title?.[lang]}</h4>
                    <p className="update-content">{u.content?.[lang]}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        {/* === PRAWA KOLUMNA: SIDEBAR (Sticky) === */}
        <div className="right-column">
          <div className="donation-card sticky-card">
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
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-info">
                <span>
                  <strong>{progress}%</strong> celu
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
                Wesprzyj teraz
              </Button>

              <Button
                variant="outline"
                size="md"
                className="btn-share-full"
                icon={<Share2 size={18} />}
              >
                Udostępnij
              </Button>
            </div>

            <div className="organizer-mini">
              <small>Organizator:</small>
              <div className="organizer-name">{applicantName}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProjectDetailsPage;
