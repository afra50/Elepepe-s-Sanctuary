import React from "react";
import Button from "./Button";

function ConfirmDialog({
  isOpen,
  message,
  confirmLabel = "Potwierdź",
  cancelLabel = "Anuluj",
  variant = "info", // "info" | "danger" | "success"
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  // dobranie wariantu przycisku "Potwierdź"
  const confirmVariant =
    variant === "danger"
      ? "primary"
      : variant === "success"
      ? "primary"
      : "accent";

  return (
    <div className="confirm-root">
      <div className={`confirm confirm--${variant}`}>
        <div className="confirm__text">{message}</div>

        <div className="confirm__actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
