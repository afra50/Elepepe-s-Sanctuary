import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// UI & Utils
import Loader from "../../components/ui/Loader";
import ErrorState from "../../components/ui/ErrorState";
import api from "../../utils/api";

// Sub-components
import ProjectHeader from "../../components/admin/project/ProjectHeader";
import ProjectContentForm from "../../components/admin/project/ProjectContentForm";
import ProjectSidebar from "../../components/admin/project/ProjectSidebar";
import ProjectMedia from "../../components/admin/project/ProjectMedia";
// NOWE:
import ProjectNews from "../../components/admin/project/ProjectNews";
import CreateNewsModal from "../../components/admin/project/CreateNewsModal";

const AdminProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("admin");

  // --- STANY ---
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  // Stan dla zakładek językowych
  const [activeLangTab, setActiveLangTab] = useState("pl");

  // --- STAN DLA AKTUALNOŚCI ---
  const [projectNews, setProjectNews] = useState([]);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [newsToEdit, setNewsToEdit] = useState(null);

  // --- POBIERANIE DANYCH ---
  const fetchProjectDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/projects/admin/${id}`);
      const data = response.data;

      // Parsowanie pól JSON
      const parseField = (field) => {
        try {
          return typeof field === "string" ? JSON.parse(field) : field || {};
        } catch (e) {
          return {};
        }
      };

      const preparedData = {
        ...data,
        title: { pl: "", en: "", es: "", ...parseField(data.title) },
        description: {
          pl: "",
          en: "",
          es: "",
          ...parseField(data.description),
        },
        country: { pl: "", en: "", es: "", ...parseField(data.country) },
        age: { pl: "", en: "", es: "", ...parseField(data.age) },
        speciesOther: parseField(data.speciesOther),
      };

      setFormData(preparedData);

      // Pobieranie aktualności (jeśli są w osobnym endpoincie lub w 'data.updates')
      // Zakładam, że backend zwraca je w data.updates lub trzeba dociągnąć osobno:
      if (data.updates) {
        setProjectNews(data.updates);
      } else {
        // Opcjonalnie: dociągnij jeśli nie ma w głównym obiekcie
        // const newsRes = await api.get(`/projects/${id}/updates`);
        // setProjectNews(newsRes.data);
        setProjectNews([]); // Placeholder
      }
    } catch (err) {
      console.error("Błąd:", err);
      setError(t("requests.fetchError") || "Nie udało się pobrać szczegółów.");
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  // --- HANDLERY FORMULARZA ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLangChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [activeLangTab]: value,
      },
    }));
  };

  const handleFilesChange = (newFiles) => {
    setFormData((prev) => ({
      ...prev,
      files: newFiles,
    }));
  };

  // --- HANDLERY NEWSÓW ---
  const handleAddNews = () => {
    setNewsToEdit(null);
    setIsNewsModalOpen(true);
  };

  const handleEditNews = (newsItem) => {
    setNewsToEdit(newsItem);
    setIsNewsModalOpen(true);
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm("Czy na pewno chcesz usunąć tę aktualność?")) return;

    try {
      // await api.delete(`/projects/${id}/updates/${newsId}`);
      setProjectNews((prev) => prev.filter((n) => n.id !== newsId));
      setAlert({ variant: "success", message: "Aktualność usunięta." });
    } catch (err) {
      setAlert({ variant: "error", message: "Błąd usuwania aktualności." });
    }
  };

  const handleSaveNews = async (newsData) => {
    // newsData zawiera { title, content, isVisible, files (nowe) } + id (jeśli edycja)

    // Tutaj logika FormData dla plików newsa
    console.log("Saving news:", newsData);

    // Symulacja (zastąp to requestem do API)
    const newUpdate = {
      id: newsData.id || Date.now(),
      title: newsData.title,
      content: newsData.content,
      isVisible: newsData.isVisible,
      createdAt: new Date().toISOString(),
      files: newsData.files || [],
    };

    if (newsData.id) {
      setProjectNews((prev) =>
        prev.map((n) => (n.id === newsData.id ? { ...n, ...newUpdate } : n))
      );
    } else {
      setProjectNews((prev) => [newUpdate, ...prev]);
    }

    setIsNewsModalOpen(false);
    setAlert({ variant: "success", message: "Aktualność zapisana!" });
  };

  // --- SAVE GLOBALNY ---
  const handleSave = async () => {
    setIsSaving(true);
    setAlert(null);
    try {
      // Przygotowanie danych (JSON + FormData jeśli pliki)
      // ... (Twoja logika zapisu z poprzednich kroków)

      console.log("Saving main project data...", formData);
      await new Promise((r) => setTimeout(r, 800));

      setAlert({ variant: "success", message: "Zapisano zmiany!" });
      fetchProjectDetails();
    } catch (err) {
      setAlert({ variant: "error", message: "Błąd zapisu." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loader size="lg" variant="center" />;
  if (error)
    return (
      <ErrorState title="Błąd" message={error} onRetry={fetchProjectDetails} />
    );
  if (!formData) return null;

  return (
    <div className="admin-project-details-page">
      <ProjectHeader
        formData={formData}
        id={id}
        onBack={() => navigate("/admin/projects")}
        onSave={handleSave}
        onChange={handleChange}
        isSaving={isSaving}
        activeLang={activeLangTab}
        alert={alert}
        setAlert={setAlert}
      />

      <div className="details-layout">
        <div className="main-content">
          <ProjectContentForm
            formData={formData}
            activeLangTab={activeLangTab}
            setActiveLangTab={setActiveLangTab}
            onLangChange={handleLangChange}
          />

          {/* NOWA SEKCJA NEWSÓW */}
          <ProjectNews
            news={projectNews}
            onAddNews={handleAddNews}
            onEditNews={handleEditNews}
            onDeleteNews={handleDeleteNews}
          />

          <ProjectMedia
            files={formData.files}
            onFilesChange={handleFilesChange}
          />
        </div>

        <div className="sidebar-content">
          <ProjectSidebar
            formData={formData}
            onChange={handleChange}
            onLangChange={handleLangChange}
            activeLang={activeLangTab}
          />
        </div>
      </div>

      {/* MODAL NEWSÓW */}
      <CreateNewsModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        newsToEdit={newsToEdit}
        onSave={handleSaveNews}
        isSaving={false} // lub stan lokalny isNewsSaving
      />
    </div>
  );
};

export default AdminProjectDetails;
