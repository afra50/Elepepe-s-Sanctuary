import React, { useState, useEffect } from "react";
import {
  Download,
  X,
  FileSpreadsheet,
  Loader as LoaderIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import DatePickerField from "./DatePickerField";
import api from "../../utils/api";
import Alert from "./Alert";

const CsvExportButton = ({ filenamePrefix = "wyplaty" }) => {
  const { t } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localAlert, setLocalAlert] = useState(null);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  useEffect(() => {
    if (isOpen) {
      setLocalAlert(null);
    }
  }, [isOpen]);

  const handleExport = async () => {
    setLocalAlert(null);

    // 1. Walidacja dat
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    startObj.setHours(0, 0, 0, 0);
    endObj.setHours(0, 0, 0, 0);

    if (startObj > endObj) {
      setLocalAlert({
        variant: "error",
        message:
          t("export.dateError") ||
          "Data początkowa nie może być późniejsza niż końcowa.",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const response = await api.get("/payouts/export", {
        params: { startDate, endDate },
        responseType: "blob",
      });

      const disposition = response.headers["content-disposition"];
      let filename = `${filenamePrefix}_${startDate}_${endDate}.csv`;

      if (disposition && disposition.indexOf("attachment") !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error("Export error raw:", error);

      let errorMessage = t("export.error") || "Wystąpił błąd.";

      // 👇 ZMIANA LOGIKI OBSŁUGI BŁĘDÓW
      if (error.response) {
        // Jeśli status to 404, wyświetlamy przetłumaczony tekst "Brak danych"
        if (error.response.status === 404) {
          errorMessage = t("export.noData");
        }
        // Jeśli inny błąd jest w Blobie, próbujemy go odczytać (np. 500)
        else if (error.response.data instanceof Blob) {
          try {
            const errorText = await error.response.data.text();
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              // Tu ewentualnie też można mapować inne kody błędów na tłumaczenia
              errorMessage = errorJson.message;
            }
          } catch (parseError) {
            // Ignorujemy błąd parsowania, zostaje domyślny
          }
        }
      }

      setLocalAlert({
        variant: "error", // Można zmienić na "info" dla 404, jeśli wolisz łagodniejszy kolor
        message: errorMessage,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="csv-export-wrapper">
      <Button
        variant="secondary"
        icon={<Download size={18} />}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDownloading}
      >
        {t("export.buttonLabel") || "CSV"}
      </Button>

      {isOpen && (
        <div className="csv-popover">
          <div className="popover-header">
            <span className="popover-title">
              <FileSpreadsheet size={16} />
              {t("export.title") || "Eksportuj dane"}
            </span>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="popover-body">
            {localAlert && (
              <div className="popover-alert">
                <Alert
                  variant={localAlert.variant}
                  onClose={() => setLocalAlert(null)}
                  autoClose={5000}
                >
                  {localAlert.message}
                </Alert>
              </div>
            )}

            <div className="date-group">
              <label>{t("export.from") || "Od:"}</label>
              <DatePickerField
                value={startDate}
                onChange={setStartDate}
                minDate={null}
                maxDate={endDate ? new Date(endDate) : null}
              />
            </div>
            <div className="date-group">
              <label>{t("export.to") || "Do:"}</label>
              <DatePickerField
                value={endDate}
                onChange={setEndDate}
                minDate={startDate ? new Date(startDate) : null}
              />
            </div>

            <div className="popover-actions">
              <Button
                variant="primary"
                size="sm"
                onClick={handleExport}
                fullWidth
                disabled={isDownloading}
                icon={
                  isDownloading ? (
                    <LoaderIcon className="animate-spin" size={16} />
                  ) : (
                    <Download size={16} />
                  )
                }
              >
                {isDownloading
                  ? t("export.downloading") || "Pobieranie..."
                  : t("export.download") || "Pobierz"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvExportButton;
