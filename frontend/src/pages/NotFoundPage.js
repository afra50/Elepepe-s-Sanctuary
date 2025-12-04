import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // <--- 1. Import hooka
import Button from "../components/ui/Button";
import Image404 from "../assets/404.png";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("notFound"); // <--- 2. Inicjalizacja z nazwą pliku (przestrzeni nazw)

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="image-wrapper">
          <img
            src={Image404}
            alt={t("altText")} // <--- 3. Tłumaczenie alta
            className="rat-img"
          />
        </div>

        <div className="content-wrapper">
          <h2 className="error-title">{t("title")}</h2>
          <p className="error-desc">{t("desc")}</p>

          <div className="actions">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGoHome}
              className="btn-responsive"
            >
              {t("btnHome")}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(-1)}
              className="btn-responsive"
            >
              {t("btnBack")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
