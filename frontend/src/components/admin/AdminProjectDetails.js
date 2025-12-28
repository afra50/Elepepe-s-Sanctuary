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

  // Dialog potwierdzenia usuwania newsa
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [newsIdToDelete, setNewsIdToDelete] = useState(null);

  // Dialog potwierdzenia zapisu (np. brak okładki)
  const [confirmSaveDialog, setConfirmSaveDialog] = useState({
    isOpen: false,
    message: "",
    variant: "info",
    onConfirm: null,
  });

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

  // --- SAVE LOGIC (WITH VALIDATION) ---
  const executeSave = async () => {
    // Zamknij dialog potwierdzenia zapisu (jeśli był otwarty)
    setConfirmSaveDialog((prev) => ({ ...prev, isOpen: false }));
    setIsSaving(true);
    setAlert(null);

    try {
      // Znajdź ID aktualnej okładki (jeśli jest)
      const coverFile = formData.files.find((f) => f.isCover && !f.isDeleted);
      const coverFileId = coverFile ? coverFile.id : null;

      const payload = {
        ...formData,
        // Convert objects to JSON strings for backend
        title: JSON.stringify(formData.title),
        description: JSON.stringify(formData.description),
        country: JSON.stringify(formData.country),
        age: JSON.stringify(formData.age),
        speciesOther: JSON.stringify(formData.speciesOther),
        // Pass cover ID explicitly
        coverFileId: coverFileId,
      };

      await api.put(`/projects/admin/${id}`, payload);

      setAlert({
        variant: "success",
        message: t("projects.alerts.saveSuccess"),
      });
      fetchProjectDetails();
    } catch (err) {
      console.error("Save error:", err);
      // --- OBSŁUGA BŁĘDÓW Z BACKENDU ---
      const errorCode = err.response?.data?.code;

      if (errorCode === "SLUG_EXISTS") {
        setAlert({
          variant: "error",
          message:
            t("projects.errors.slugExists") ||
            "Ten link (slug) jest już zajęty.",
        });
      } else if (errorCode === "VALIDATION_ERROR") {
        setAlert({
          variant: "error",
          message:
            t("projects.alerts.validationError") ||
            "Błąd walidacji danych. Sprawdź formularz.",
        });
      } else {
        // Domyślny błąd
        setAlert({
          variant: "error",
          message:
            t("projects.alerts.saveError") || "Wystąpił błąd podczas zapisu.",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    // 1. Walidacja podstawowa (pola wspólne)
    if (!formData.slug || !formData.animalName) {
      setAlert({
        variant: "error",
        message:
          t("projects.errors.basicDataRequired") ||
          "Uzupełnij podstawowe dane (Slug, Imię).",
      });
      return;
    }

    if (formData.amountTarget <= 0) {
      setAlert({
        variant: "error",
        message:
          t("projects.errors.amountTargetPositive") ||
          "Cel zbiórki musi być większy od 0.",
      });
      return;
    }

    // 2. Ścisła walidacja wszystkich języków
    const languages = ["pl", "en", "es"];
    // Lista pól, które muszą być wypełnione w każdym języku
    const requiredTransFields = ["title", "description", "country"];

    for (const lang of languages) {
      for (const field of requiredTransFields) {
        const value = formData[field][lang];

        // Sprawdzamy czy wartość istnieje i nie jest pustym stringiem (same spacje)
        if (!value || !value.trim()) {
          // A. Przełącz widok na język, w którym jest błąd (UX)
          setActiveLangTab(lang);

          // B. Pobierz przetłumaczoną nazwę pola (np. "Tytuł" lub "Title")
          const fieldName = t(`projects.fields.${field}`);
          const langLabel = lang.toUpperCase();

          // C. Wyświetl błąd
          setAlert({
            variant: "error",
            // Używamy klucza, który masz w plikach JSON: "fieldRequiredInLang"
            message:
              t("projects.errors.fieldRequiredInLang", {
                field: fieldName,
                lang: langLabel,
              }) || `Pole "${fieldName}" jest wymagane w języku ${langLabel}.`,
          });

          return; // Przerwij zapisywanie
        }
      }

      // Opcjonalnie: Walidacja "Gatunek (Inne)" tylko jeśli wybrano "other"
      if (formData.species === "other") {
        const speciesOtherVal = formData.speciesOther[lang];
        if (!speciesOtherVal || !speciesOtherVal.trim()) {
          setActiveLangTab(lang);
          const fieldName = t("projects.fields.speciesOther");
          const langLabel = lang.toUpperCase();

          setAlert({
            variant: "error",
            message: t("projects.errors.speciesOtherRequiredInLang", {
              field: fieldName,
              lang: langLabel,
            }),
          });
          return;
        }
      }
    }

    // 3. Walidacja okładki (Twoja istniejąca logika)
    const hasPhotos = formData.files.some(
      (f) => f.type === "photo" && !f.isDeleted
    );
    const hasCover = formData.files.some((f) => f.isCover && !f.isDeleted);

    if (hasPhotos && !hasCover) {
      setConfirmSaveDialog({
        isOpen: true,
        message: t("projects.alerts.noCoverPhoto"),
        variant: "warning",
        onConfirm: executeSave,
      });
      return;
    }

    // 4. Jeśli wszystko OK -> Wykonaj zapis
    executeSave();
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
      await api.delete(`/projects/${id}/updates/${newsIdToDelete}`);
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
      setIsDeleteConfirmOpen(false);
      setNewsIdToDelete(null);
    }
  };

  const cancelDeleteNews = () => {
    setIsDeleteConfirmOpen(false);
    setNewsIdToDelete(null);
  };

  const handleSaveNews = async (newsData) => {
    setIsSavingNews(true);
    try {
      const payload = {
        title: newsData.title,
        content: newsData.content,
        isVisible: newsData.isVisible,
      };

      if (newsData.id) {
        // --- EDYCJA (PUT) ---
        // Pamiętaj, aby dodać endpoint PUT w backendzie dla edycji newsa!
        // await api.put(`/projects/${id}/updates/${newsData.id}`, payload);
        alert("Edycja newsa wymaga implementacji PUT w backendzie");
      } else {
        // --- TWORZENIE (POST) ---
        await api.post(`/projects/${id}/updates`, payload);
      }

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
            onViewRequest={handleViewOriginalRequest}
          />
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. News Modal */}
      <CreateNewsModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        newsToEdit={newsToEdit}
        onSave={handleSaveNews}
        isSaving={isSavingNews}
      />

      {/* 2. Original Request Modal (Read-only) */}
      <RequestDetailsModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        details={originalRequest}
        isLoading={isRequestLoading}
        onApprove={null}
        onReject={null}
        onViewProject={null}
      />

      {/* 3. Delete News Confirmation Dialog */}
      {isDeleteConfirmOpen && (
        <div
          className="portal-confirm-container"
          style={{ position: "fixed", zIndex: 9999 }}
        >
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
        </div>
      )}

      {/* 4. Save Project Confirmation Dialog (e.g. No Cover) */}
      {confirmSaveDialog.isOpen && (
        <div
          className="portal-confirm-container"
          style={{ position: "fixed", zIndex: 9999 }}
        >
          <ConfirmDialog
            isOpen={confirmSaveDialog.isOpen}
            variant={confirmSaveDialog.variant}
            message={confirmSaveDialog.message}
            confirmLabel={t("actions.yes") || "Tak"}
            cancelLabel={t("actions.cancel") || "Anuluj"}
            onConfirm={confirmSaveDialog.onConfirm}
            onCancel={() =>
              setConfirmSaveDialog((prev) => ({ ...prev, isOpen: false }))
            }
          />
        </div>
      )}
    </div>
  );
};

export default AdminProjectDetails;
