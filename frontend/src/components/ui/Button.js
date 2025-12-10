// src/components/ui/Button.jsx
import React from "react";

function Button({
  children,
  variant = "primary", // primary | secondary | accent | ghost | outline
  size = "md", // sm | md | lg
  type = "button",
  className = "",
  disabled = false,
  icon, // <--- 1. Pobieramy ikonę
  ...rest
}) {
  const classes = [
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    disabled ? "btn--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={disabled} {...rest}>
      {/* 2. Wyświetlamy ikonę, jeśli istnieje */}
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}

export default Button;
