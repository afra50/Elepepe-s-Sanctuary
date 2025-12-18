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

  // Stan dla zakładek językowych (przekazywany do ContentForm)
  const [activeLangTab, setActiveLangTab] = useState("pl");

  // --- POBIERANIE DANYCH ---
  const fetchProjectDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/projects/admin/${id}`);
      const data = response.data;

      const parseField = (field) => {
        try {
          return typeof field === "string" ? JSON.parse(field) : field || {};
        } catch (e) {
          return {};
        }
      };

      // Przygotowanie danych
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

  // --- HANDLERY ---
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

  const handleSave = async () => {
    setIsSaving(true);
    setAlert(null);
    try {
      const payload = {
        ...formData,
        title: JSON.stringify(formData.title),
        description: JSON.stringify(formData.description),
        country: JSON.stringify(formData.country),
        age: JSON.stringify(formData.age),
        speciesOther: JSON.stringify(formData.speciesOther),
        isUrgent: formData.isUrgent ? 1 : 0,
      };

      // await api.put(`/projects/${id}`, payload); // Odkomentuj jak backend będzie gotowy
      console.log("Saving payload:", payload);
      await new Promise((r) => setTimeout(r, 800)); // Mock save

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

          <ProjectMedia files={formData.files} />

          {/* Tu można dodać ProjectNewsSection w przyszłości */}
        </div>

        <div className="sidebar-content">
          <ProjectSidebar formData={formData} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
};

export default AdminProjectDetails;
