// ui/Select.jsx
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
// Opcjonalnie: jeśli chcesz używać styli z pliku .scss, zaimportuj je lub polegaj na klasach globalnych
// import "./select.scss";

const Select = ({
  options = [], // [{ value: '...', label: '...' }]
  value,
  onChange,
  placeholder = "Wybierz...",
  disabled = false,
  className = "",
  style = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Znajdź aktualnie wybraną opcję, aby wyświetlić jej label
  const selectedOption = options.find((opt) => opt.value === value);

  // Zamykanie przy kliknięciu poza
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    // Używamy klasy "searchable-select" (lub nowej "custom-select"),
    // aby dziedziczyć te same style co SearchableSelect
    <div
      className={`searchable-select ${disabled ? "disabled" : ""} ${className}`}
      ref={containerRef}
      style={style}
    >
      {/* KONTROLKA (Wygląda jak input) */}
      <div
        className="searchable-select__control"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span
          className={`value-display ${!selectedOption ? "placeholder" : ""}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="icons">
          <ChevronDown size={16} className={`arrow ${isOpen ? "open" : ""}`} />
        </div>
      </div>

      {/* ROZWIJANA LISTA */}
      {isOpen && (
        <div className="searchable-select__dropdown">
          {/* Brak pola input search */}

          <ul className="options-list">
            {options.map((opt) => (
              <li
                key={opt.value}
                className={`option-item ${
                  opt.value === value ? "selected" : ""
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
                {/* Opcjonalnie: ikona wyboru */}
                {opt.value === value && <Check size={14} />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Select;
