// src/components/ui/Alert.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // <--- 1. Importujemy createPortal

function Alert({ variant = "info", children, onClose, autoClose = 5000 }) {
  // 2. Fix dla SSR (opcjonalne, ale bezpieczne dla Next.js/Gatsby)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!autoClose || !onClose) return;

    const timerId = setTimeout(() => {
      onClose();
    }, autoClose);

    return () => clearTimeout(timerId);
  }, [autoClose, onClose]);

  // Jeśli komponent nie jest zamontowany w przeglądarce, nic nie zwracamy
  if (!mounted) return null;

  // 3. Definiujemy zawartość alertu
  const alertContent = (
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

  // 4. Zwracamy Portal zamiast zwykłego JSX
  // Wrzucamy alertContent bezpośrednio do document.body
  return createPortal(alertContent, document.body);
}

export default Alert;
