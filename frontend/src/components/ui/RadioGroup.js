import React from "react";

function RadioGroup({
  name,
  value,
  options,
  onChange,
  inline = false,
  ariaLabel,
}) {
  const handleChange = (event) => {
    const newValue = event.target.value;
    if (onChange) onChange(newValue);
  };

  return (
    <div
      className={`radio-group ${inline ? "radio-group--inline" : ""}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <label key={option.value} className="radio-option">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={handleChange}
          />
          <span className="radio-option__custom" />
          <span className="radio-option__text">
            <span className="radio-option__label">{option.label}</span>
            {option.description && (
              <span className="radio-option__description">
                {option.description}
              </span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}

export default RadioGroup;
