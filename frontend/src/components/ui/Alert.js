// src/components/ui/Alert.jsx
import React, { useEffect } from "react";

function Alert({
  variant = "info", // "success" | "error" | "info"
  children,
  onClose,
  autoClose = 5000, // ms; null/0 = bez auto-zamykania
}) {
  useEffect(() => {
    if (!autoClose || !onClose) return;

    const timerId = setTimeout(() => {
      onClose();
    }, autoClose);

    return () => clearTimeout(timerId);
  }, [autoClose, onClose]);

  return (
    <div className="alert-root">
      <div className={`alert alert--${variant}`}>
        <div className="alert__text">{children}</div>

        {onClose && (
          <button
            type="button"
            className="alert__close"
            onClick={onClose}
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert;
