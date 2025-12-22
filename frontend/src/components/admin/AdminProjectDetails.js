import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// UI & Utils
import Loader from "../../components/ui/Loader";
import ErrorState from "../../components/ui/ErrorState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import api from "../../utils/api";

// Sub-components
import ProjectHeader from "../../components/admin/project/ProjectHeader";
import ProjectContentForm from "../../components/admin/project/ProjectContentForm";
import ProjectSidebar from "../../components/admin/project/ProjectSidebar";
import ProjectMedia from "../../components/admin/project/ProjectMedia";
import ProjectNews from "../../components/admin/project/ProjectNews";
import CreateNewsModal from "../../components/admin/project/CreateNewsModal";
import RequestDetailsModal from "../../components/admin/RequestDetailsModal";

const AdminProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("admin");

  // --- PROJECT STATE ---
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [activeLangTab, setActiveLangTab] = useState("pl");

  // --- NEWS STATE ---
  const [projectNews, setProjectNews] = useState([]);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [newsToEdit, setNewsToEdit] = useState(null);
  const [isSavingNews, setIsSavingNews] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [newsIdToDelete, setNewsIdToDelete] = useState(null);

  // --- ORIGINAL REQUEST MODAL STATE ---
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [originalRequest, setOriginalRequest] = useState(null);
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  // --- FETCH DATA ---
  const fetchProjectDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/projects/admin/${id}`);
      const data = response.data;

      // Safe JSON parsing helper
      const parseField = (field) => {
        try {
          return typeof field === "string" ? JSON.parse(field) : field || {};
        } catch (e) {
          return {};
        }
      };

      const preparedData = {
        ...data,
        // Ensure multilingual fields have structure even if empty
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

      // Handle news from the new backend structure
      if (data.news) {
        setProjectNews(data.news);
      } else {
        setProjectNews([]);
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(t("requests.fetchError") || "Failed to load project details.");
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  // --- HANDLER: VIEW ORIGINAL REQUEST ---
  const handleViewOriginalRequest = async () => {
    if (!formData.requestId) return;

    setIsRequestModalOpen(true);

    // If we already have the specific request loaded, don't fetch again
    if (originalRequest && originalRequest.id === formData.requestId) return;

    setIsRequestLoading(true);
    try {
      const response = await api.get(`/requests/${formData.requestId}`);
      setOriginalRequest(response.data);
    } catch (err) {
      console.error("Error fetching original request:", err);
      setAlert({
        variant: "error",
        message: "Failed to fetch original request data.",
      });
      setIsRequestModalOpen(false);
    } finally {
      setIsRequestLoading(false);
    }
  };

  // --- HANDLERS: FORM & FILES ---
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
      [field]: { ...prev[field], [activeLangTab]: value },
    }));
  };

  const handleFilesChange = (newFiles) => {
    setFormData((prev) => ({ ...prev, files: newFiles }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setAlert(null);
    try {
      // Prepare payload for backend
      // Note: You might need to handle file uploads separately via FormData if they are new files
      const payload = {
        ...formData,
        title: JSON.stringify(formData.title),
        description: JSON.stringify(formData.description),
        country: JSON.stringify(formData.country),
        age: JSON.stringify(formData.age),
        speciesOther: JSON.stringify(formData.speciesOther),
      };

      // Example save logic (adapt to your API needs)
      await api.put(`/projects/admin/${id}`, payload);

      setAlert({
        variant: "success",
        message: t("projects.alerts.saveSuccess") || "Changes saved!",
      });
      // Refresh data to get clean state
      fetchProjectDetails();
    } catch (err) {
      console.error("Save error:", err);
      setAlert({
        variant: "error",
        message: t("projects.alerts.saveError") || "Error saving changes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- HANDLERS: NEWS ---
  const handleAddNews = () => {
    setNewsToEdit(null);
    setIsNewsModalOpen(true);
  };

  const handleEditNews = (newsItem) => {
    setNewsToEdit(newsItem);
    setIsNewsModalOpen(true);
  };

  const handleDeleteNewsClick = (newsId) => {
    setNewsIdToDelete(newsId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteNews = async () => {
    if (!newsIdToDelete) return;

    try {
      // Wywołanie API (upewnij się, że endpoint pasuje do backendu)
      await api.delete(`/projects/${id}/updates/${newsIdToDelete}`);

      // Aktualizacja stanu lokalnego (usunięcie z listy)
      setProjectNews((prev) => prev.filter((n) => n.id !== newsIdToDelete));

      setAlert({
        variant: "success",
        message: t("projects.alerts.deleteSuccess") || "Aktualność usunięta.",
      });
    } catch (err) {
      console.error(err);
      setAlert({
        variant: "error",
        message:
          t("projects.alerts.deleteError") || "Błąd usuwania aktualności.",
      });
    } finally {
      // Zamknij dialog i wyczyść ID
      setIsDeleteConfirmOpen(false);
      setNewsIdToDelete(null);
    }
  };

  // 3. Anulowanie usuwania
  const cancelDeleteNews = () => {
    setIsDeleteConfirmOpen(false);
    setNewsIdToDelete(null);
  };

  const handleSaveNews = async (newsData) => {
    setIsSavingNews(true);
    try {
      // Przygotowujemy prosty obiekt JSON (bez plików na razie)
      const payload = {
        title: newsData.title,
        content: newsData.content,
        isVisible: newsData.isVisible,
      };

      if (newsData.id) {
        // --- EDYCJA (PUT) ---
        // Tutaj będziesz musiał dorobić endpoint PUT w backendzie w przyszłości
        await api.put(`/projects/${id}/updates/${newsData.id}`, payload);
      } else {
        // --- TWORZENIE (POST) ---
        await api.post(`/projects/${id}/updates`, payload);
      }

      // Zamknij modal i odśwież dane
      setIsNewsModalOpen(false);
      setAlert({ variant: "success", message: "Aktualność zapisana!" });
      fetchProjectDetails();
    } catch (err) {
      console.error("Error saving news:", err);
      setAlert({
        variant: "error",
        message: "Nie udało się zapisać aktualności.",
      });
    } finally {
      setIsSavingNews(false);
    }
  };
  if (isLoading) return <Loader size="lg" variant="center" />;
  if (error)
    return (
      <ErrorState
        title={t("common.error")}
        message={error}
        onRetry={fetchProjectDetails}
      />
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

          <ProjectNews
            news={projectNews}
            onAddNews={handleAddNews}
            onEditNews={handleEditNews}
            onDeleteNews={handleDeleteNewsClick}
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
            // Pass the handler to open the modal
            onViewRequest={handleViewOriginalRequest}
          />
        </div>
      </div>

      {/* NEWS MODAL */}
      <CreateNewsModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        newsToEdit={newsToEdit}
        onSave={handleSaveNews}
        isSaving={isSavingNews}
      />

      {/* ORIGINAL REQUEST MODAL (READ ONLY) */}
      <RequestDetailsModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        details={originalRequest}
        isLoading={isRequestLoading}
        // Hide actions since we are just viewing reference data
        onApprove={null}
        onReject={null}
        onViewProject={null}
      />

      {isDeleteConfirmOpen && (
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          variant="danger"
          message={
            t("projects.confirmDeleteNews") ||
            "Czy na pewno chcesz usunąć tę aktualność?"
          }
          confirmLabel={t("actions.delete") || "Usuń"}
          cancelLabel={t("common.cancel") || "Anuluj"}
          onConfirm={confirmDeleteNews}
          onCancel={cancelDeleteNews}
        />
      )}
    </div>
  );
};

export default AdminProjectDetails;
