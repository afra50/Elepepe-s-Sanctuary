import React from "react";

function Checkbox({
  name,
  checked,
  onChange,
  children,
  description,
  disabled = false,
  ariaLabel,
}) {
  const handleChange = (event) => {
    if (disabled) return;
    const value = event.target.checked;
    if (onChange) onChange(value);
  };

  return (
    <label
      className={`checkbox ${disabled ? "checkbox--disabled" : ""}`}
      aria-label={ariaLabel}
    >
      <input
        type="checkbox"
        name={name}
        checked={!!checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <span className="checkbox__box" />
      <span className="checkbox__text">
        <span className="checkbox__label">{children}</span>
        {description && (
          <span className="checkbox__description">{description}</span>
        )}
      </span>
    </label>
  );
}

export default Checkbox;
