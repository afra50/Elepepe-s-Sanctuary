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

      // Helper do JSON
      const parseField = (field) => {
        try {
          return typeof field === "string" ? JSON.parse(field) : field || {};
        } catch (e) {
          return {};
        }
      };

      // Przetwarzanie plików: dodajemy flagi isDeleted: false
      const processedFiles = (data.files || []).map((f) => ({
        ...f,
        isDeleted: false,
        // Upewniamy się, że typ jest poprawny ('photo'/'document')
        type: f.type || "document",
      }));

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
        // Fix daty dla inputa
        deadline: data.deadline ? data.deadline.split("T")[0] : "",
        // Przypisujemy przetworzone pliki
        files: processedFiles,
      };

      setFormData(preparedData);

      if (data.news) setProjectNews(data.news);
      else setProjectNews([]);
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

  // --- SAVE LOGIC (Z AKTUALIZACJĄ PLIKÓW) ---
  const executeSave = async () => {
    setConfirmSaveDialog((prev) => ({ ...prev, isOpen: false }));
    setIsSaving(true);
    setAlert(null);

    try {
      // 1. Tworzymy FormData (niezbędne do przesłania plików)
      const data = new FormData();

      // 2. Dodajemy pola tekstowe
      data.append("applicantType", formData.applicantType);
      data.append("fullName", formData.fullName);
      data.append("animalName", formData.animalName);
      data.append("animalsCount", formData.animalsCount);
      data.append("species", formData.species);
      data.append("city", formData.city || "");
      data.append("slug", formData.slug);
      data.append("status", formData.status);
      data.append("isUrgent", formData.isUrgent);
      data.append("amountTarget", formData.amountTarget);
      data.append("amountCollected", formData.amountCollected);
      data.append("currency", formData.currency);
      data.append("deadline", formData.deadline);

      // 3. Pola JSON (Joi na backendzie oczekuje stringów dla tych pól)
      data.append("title", JSON.stringify(formData.title));
      data.append("description", JSON.stringify(formData.description));
      data.append("country", JSON.stringify(formData.country));
      data.append("age", JSON.stringify(formData.age));
      data.append("speciesOther", JSON.stringify(formData.speciesOther));

      // 4. Okładka
      // Szukamy pliku, który ma flagę isCover=true i NIE jest usunięty
      const coverFile = formData.files.find((f) => f.isCover && !f.isDeleted);

      if (coverFile) {
        // Jeśli to stary plik -> wysyłamy ID numeryczne (np. "15")
        // Jeśli to nowy plik -> wysyłamy ID tymczasowe (np. "new-abc")
        data.append("coverFileId", coverFile.id);
      } else {
        data.append("coverFileId", "");
      }

      // 5. Pliki do usunięcia (tylko STARE, które mają numeryczne ID)
      const filesToDelete = formData.files
        .filter((f) => f.isDeleted && !f.isNew)
        .map((f) => f.id);

      data.append("filesToDelete", JSON.stringify(filesToDelete));

      // 6. Nowe pliki (Upload)
      const newFileNamesMap = {}; // Mapa: tempId -> oryginalna nazwa pliku

      formData.files.forEach((file) => {
        // Interesują nas tylko nowe pliki, które nie zostały usunięte
        if (file.isNew && !file.isDeleted && file.file) {
          if (file.type === "photo") {
            // Sztuczka: zmieniamy nazwę pliku w FormData na jego tempId (np. "new-abc.jpg")
            // Dzięki temu backend wie, który plik fizyczny odpowiada któremu ID w mapie
            const ext = file.file.name.split(".").pop();
            const formDataName = `${file.id}.${ext}`;

            data.append("newPhotos", file.file, formDataName);
            newFileNamesMap[file.id] = file.file.name;
          } else {
            const ext = file.file.name.split(".").pop();
            const formDataName = `${file.id}.${ext}`;

            data.append("newDocuments", file.file, formDataName);
            newFileNamesMap[file.id] = file.file.name;
          }
        }
      });

      // Wysyłamy mapę nazw, żeby backend mógł zapisać oryginalną nazwę pliku w bazie
      data.append("newFileNames", JSON.stringify(newFileNamesMap));

      // 7. Wysyłka
      await api.put(`/projects/admin/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAlert({
        variant: "success",
        message: t("projects.alerts.saveSuccess") || "Zapisano zmiany!",
      });

      // Odświeżamy dane, aby pobrać prawdziwe ID nowych plików z bazy
      fetchProjectDetails();
    } catch (err) {
      console.error("Save error:", err);

      // --- NOWA OBSŁUGA BŁĘDÓW (TUTAJ ZMIANA) ---
      let errorMessage =
        t("projects.alerts.saveError") || "Wystąpił błąd podczas zapisu.";

      if (err.response && err.response.data) {
        const { code } = err.response.data;

        // 1. Błędy biznesowe (slug, walidacja)
        if (code === "SLUG_EXISTS") {
          errorMessage = t("projects.errors.slugExists");
        } else if (code === "VALIDATION_ERROR") {
          errorMessage = t("projects.alerts.validationError");
        }
        // 2. Błędy plików (Multer / UploadMiddleware)
        else if (code === "LIMIT_FILE_SIZE") {
          errorMessage = t("common.errors.fileTooLarge");
        } else if (
          code === "LIMIT_FILE_COUNT" ||
          code === "LIMIT_UNEXPECTED_FILE"
        ) {
          errorMessage = t("common.errors.tooManyFiles");
        } else if (code === "INVALID_FILE_TYPE") {
          errorMessage = t("common.errors.unsupportedFileType");
        }
      }

      setAlert({
        variant: "error",
        message: errorMessage,
      });
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

  const handleSaveNews = async (newsPayload) => {
    // 1. Walidacja frontendowa (Guard)
    if (!newsPayload.title?.pl || !newsPayload.content?.pl) {
      setAlert({
        variant: "error",
        message: t("projects.newsModal.errors.titleRequired") || "Błąd danych.",
      });
      return;
    }

    setIsSavingNews(true);
    try {
      const formData = new FormData();

      // 2. Dane
      formData.append("title", JSON.stringify(newsPayload.title));
      formData.append("content", JSON.stringify(newsPayload.content));
      formData.append("isVisible", String(newsPayload.isVisible));

      // 3. Pliki (upload)
      if (newsPayload.filesToUpload && newsPayload.filesToUpload.length > 0) {
        newsPayload.filesToUpload.forEach((file) => {
          formData.append("files", file);
        });
      }

      // 4. Usuwanie
      if (newsPayload.filesToDelete && newsPayload.filesToDelete.length > 0) {
        formData.append(
          "filesToDelete",
          JSON.stringify(newsPayload.filesToDelete)
        );
      }

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
      };

      // 5. Wysłanie
      if (newsPayload.id) {
        await api.put(
          `/projects/${id}/updates/${newsPayload.id}`,
          formData,
          config
        );
      } else {
        await api.post(`/projects/${id}/updates`, formData, config);
      }

      // 6. Sukces
      setIsNewsModalOpen(false);
      setAlert({
        variant: "success",
        message: t("projects.news.savedSuccess") || "Aktualność zapisana!",
      });
      fetchProjectDetails();
    } catch (err) {
      console.error("Error saving news:", err);

      // --- OBSŁUGA BŁĘDÓW BACKENDU ---
      let errorMessage =
        t("projects.news.saveError") || "Nie udało się zapisać aktualności.";

      if (err.response && err.response.data) {
        const { code } = err.response.data;

        // Mapowanie kodów błędów na tłumaczenia
        if (code === "LIMIT_FILE_COUNT" || code === "LIMIT_UNEXPECTED_FILE") {
          errorMessage =
            t("common.errors.tooManyFiles") || "Przekroczono limit plików.";
        } else if (code === "LIMIT_FILE_SIZE") {
          errorMessage =
            t("common.errors.fileTooLarge") || "Plik jest zbyt duży.";
        } else if (code === "INVALID_FILE_TYPE") {
          // <--- DODAJ TO
          errorMessage =
            t("common.errors.unsupportedFileType") ||
            "Nieobsługiwany format pliku.";
        } else if (code === "VALIDATION_ERROR") {
          errorMessage =
            t("common.errors.validationError") || "Błąd walidacji danych.";
        }
      }

      setAlert({
        variant: "error",
        message: errorMessage,
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

      <CreateNewsModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        newsToEdit={newsToEdit}
        onSave={handleSaveNews}
        isSaving={isSavingNews}
      />

      <RequestDetailsModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        details={originalRequest}
        isLoading={isRequestLoading}
        onApprove={null}
        onReject={null}
        onViewProject={null}
      />

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
