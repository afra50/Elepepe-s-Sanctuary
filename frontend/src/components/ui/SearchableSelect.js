// ui/SearchableSelect.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, X, Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next"; // <--- 1. IMPORT

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  // Domyślny placeholder może zostać nadpisany przez props, ale jeśli nie, użyjemy tłumaczenia
  placeholder,
  disabled = false,
}) => {
  const { t } = useTranslation("common"); // <--- 2. HOOK (namespace 'common')

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Znajdź etykietę wybranego elementu
  const selectedOption = options.find((opt) => opt.value === value);

  // Filtrowanie opcji po wpisaniu tekstu
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Zamykanie przy kliknięciu poza komponent
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

  // Focus na input po otwarciu
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange("");
  };

  // Ustalanie tekstu wyświetlanego (Placeholder)
  // Priorytet: props.placeholder -> tłumaczenie -> "..."
  const displayPlaceholder = placeholder || t("select.placeholder");

  return (
    <div
      className={`searchable-select ${disabled ? "disabled" : ""}`}
      ref={containerRef}
    >
      {/* GLÓWNY PRZYCISK */}
      <div
        className="searchable-select__control"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span
          className={`value-display ${!selectedOption ? "placeholder" : ""}`}
        >
          {selectedOption ? selectedOption.label : displayPlaceholder}
        </span>

        <div className="icons">
          {value && !disabled && (
            <span
              className="clear-icon"
              onClick={clearSelection}
              title={t("select.clear")} // <--- Tłumaczenie tooltipa
            >
              <X size={16} />
            </span>
          )}
          <ChevronDown size={16} className={`arrow ${isOpen ? "open" : ""}`} />
        </div>
      </div>

      {/* ROZWIJANA LISTA */}
      {isOpen && (
        <div className="searchable-select__dropdown">
          {/* Pole szukania */}
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t("select.searchPlaceholder")} // <--- Tłumaczenie placeholdera szukania
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Lista opcji */}
          <ul className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li
                  key={opt.value}
                  className={`option-item ${
                    opt.value === value ? "selected" : ""
                  }`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                  {opt.value === value && <Check size={14} />}
                </li>
              ))
            ) : (
              <li className="no-results">{t("select.noResults")}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
