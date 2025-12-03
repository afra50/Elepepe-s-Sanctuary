import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Image404 from "../assets/404.png";

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="image-wrapper">
          <img
            src={Image404}
            alt="Smutny szczurek zgubił drogę"
            className="rat-img"
          />
        </div>

        <div className="content-wrapper">
          <h1 className="error-code">404</h1>
          <h2 className="error-title">Ojej! Taka strona nie istnieje</h2>
          <p className="error-desc">
            Wygląda na to, że ten link prowadzi donikąd. Nasz mały przyjaciel
            szukał wszędzie, ale nic tu nie znalazł.
          </p>

          <div className="actions">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGoHome}
              className="btn-responsive"
            >
              Wróć na stronę główną
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(-1)}
              className="btn-responsive"
            >
              Wróć tam, gdzie byłeś
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
