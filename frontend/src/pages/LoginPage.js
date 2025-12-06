import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Dodano useLocation
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Loader from "../components/ui/Loader";
import { useTranslation } from "react-i18next";
import api from "../utils/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Pobranie lokalizacji, skąd użytkownik przyszedł
  const { t } = useTranslation("login");

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sprawdzamy, czy użytkownik został przekierowany z innej podstrony
  // Jeśli tak, po zalogowaniu wrócimy tam. Jeśli nie, idziemy do "/admin"
  const from = location.state?.from?.pathname || "/admin";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.username || !formData.password) {
      setError(t("errorEmpty"));
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/login", {
        username: formData.username,
        password: formData.password,
      });

      // Jeśli sukces, przekieruj do panelu (lub tam skąd przyszedł)
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      // --- TŁUMACZENIE BŁĘDÓW ---
      const backendError = err.response?.data?.error;
      let errorMsgKey = "errorDefault"; // Domyślny klucz błędu

      // Mapowanie komunikatów z backendu na klucze tłumaczeń
      if (backendError === "Invalid credentials") {
        errorMsgKey = "errorInvalidCredentials";
      } else if (err.response?.status === 500) {
        errorMsgKey = "errorServerError";
      } else if (backendError === "Missing authorization token") {
        errorMsgKey = "errorSessionExpired";
      }

      // Ustawienie przetłumaczonego komunikatu (lub fallback do tekstu z backendu)
      setError(
        t(errorMsgKey) !== errorMsgKey
          ? t(errorMsgKey)
          : backendError || t("errorDefault")
      );
    } finally {
      setIsLoading(false);
    }
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
