// src/components/ui/ErrorState.jsx
import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Button from "./Button";

const ErrorState = ({ title, message, onRetry }) => {
  // ZMIANA: Podajemy "common" jako namespace
  const { t } = useTranslation("common");

  return (
    <div className="error-state-container">
      <div className="error-icon-wrapper">
        <AlertCircle size={48} strokeWidth={1.5} />
      </div>

      <h3 className="error-title">
        {/* Odwołujemy się do kluczy w pliku common.json */}
        {title || t("errorState.title")}
      </h3>

      <p className="error-message">{message || t("errorState.message")}</p>

      {onRetry && (
        <Button
          variant="accent"
          onClick={onRetry}
          icon={<RotateCcw size={16} />}
        >
          {t("errorState.retry")}
        </Button>
      )}
    </div>
  );
};

ErrorState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
};

export default ErrorState;
