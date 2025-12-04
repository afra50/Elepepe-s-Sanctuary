import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Loader from "../components/ui/Loader";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("login");

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      if (formData.username && formData.password) {
        navigate("/admin");
      } else {
        setError(t("errorEmpty"));
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <>
      {error && (
        <Alert variant="error" onClose={() => setError("")} autoClose={5000}>
          {error}
        </Alert>
      )}

      <div className="login-page">
        <div className="login-card">
          <header className="login-header">
            <h1>{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </header>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <label htmlFor="username">{t("usernameLabel")}</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder={t("usernamePlaceholder")}
                autoComplete="username"
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">{t("passwordLabel")}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t("passwordPlaceholder")}
                autoComplete="current-password"
              />
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
              >
                {isLoading ? (
                  /* Używamy klasy zamiast stylów inline */
                  <div className="btn-loading-content">
                    <Loader size="sm" />
                    <span>{t("btnLoading")}</span>
                  </div>
                ) : (
                  t("btnSubmit")
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
