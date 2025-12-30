import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api from "../utils/api";
import Loader from "../components/ui/Loader";
import ErrorState from "../components/ui/ErrorState";

function ProjectDetailsPage() {
  const { slug } = useParams();
  const { i18n } = useTranslation();
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
        console.log("PROJECT DETAILS:", res.data); // 👈 mega ważne
      })
      .catch((err) => {
        console.error("Failed to load project", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <Loader variant="center" size="md" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Nie udało się załadować zbiórki"
        message="Spróbuj ponownie za chwilę."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!project) {
    return null;
  }

  return (
    <main className="project-details-page">
      {/* ===== HERO ===== */}
      <section>
        <h1>{project.title?.[lang]}</h1>

        {project.isUrgent && <strong>PILNE</strong>}

        <p>
          {project.applicant?.label?.[lang]} –{" "}
          <strong>{project.applicant?.name}</strong>
        </p>
      </section>

      {/* ===== FINANSE ===== */}
      <section>
        <h2>Finanse</h2>
        <p>
          Zebrano: {project.finance.collected} {project.finance.currency}
        </p>
        <p>
          Cel: {project.finance.target} {project.finance.currency}
        </p>
        <p>Termin: {project.finance.deadline}</p>
      </section>

      {/* ===== ZWIERZĘ ===== */}
      <section>
        <h2>Podopieczni</h2>
        <p>
          Imię: <strong>{project.animal.name}</strong>
        </p>
        <p>Liczba: {project.animal.count}</p>
        <p>Gatunek: {project.animal.species}</p>

        {project.animal.speciesOther?.[lang] && (
          <p>Inne: {project.animal.speciesOther[lang]}</p>
        )}

        {project.animal.age?.[lang] && <p>Wiek: {project.animal.age[lang]}</p>}
      </section>

      {/* ===== LOKALIZACJA ===== */}
      <section>
        <h2>Lokalizacja</h2>
        <p>
          {project.location.city}, {project.location.country?.[lang]}
        </p>
      </section>

      {/* ===== OPIS ===== */}
      <section>
        <h2>Opis</h2>
        <p>{project.description?.[lang]}</p>
      </section>

      {/* ===== GALERIA ===== */}
      <section>
        <h2>Galeria</h2>

        {project.gallery.cover && (
          <>
            <p>Okładka:</p>
            <img src={project.gallery.cover} alt="" style={{ maxWidth: 300 }} />
          </>
        )}

        <p>Zdjęcia:</p>
        <ul>
          {project.gallery.photos.map((url, idx) => (
            <li key={idx}>{url}</li>
          ))}
        </ul>

        <p>Dokumenty:</p>
        <ul>
          {project.gallery.documents.map((doc, idx) => (
            <li key={idx}>
              <a href={doc.url} target="_blank" rel="noreferrer">
                {doc.name}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== AKTUALNOŚCI ===== */}
      <section>
        <h2>Aktualności</h2>

        {project.updates.length === 0 && <p>Brak aktualności.</p>}

        {project.updates.map((u) => (
          <article key={u.id}>
            <h3>{u.title?.[lang]}</h3>
            <small>{u.publishedAt}</small>
            <p>{u.content?.[lang]}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default ProjectDetailsPage;
