// src/components/ui/Button.jsx
import React from "react";

function Button({
  children,
  variant = "primary", // primary | secondary | accent | ghost
  size = "md", // sm | md | lg
  type = "button",
  className = "",
  disabled = false,
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
      {children}
    </button>
  );
}

export default Button;
