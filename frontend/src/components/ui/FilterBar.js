// ui/FilterBar.jsx
import React from "react";
import { ArrowUp, ArrowDown, Filter } from "lucide-react";
import Button from "./Button";
import Select from "./Select"; // <--- IMPORTUJEMY NOWY KOMPONENT
import { useTranslation } from "react-i18next";

const FilterBar = ({
  sortBy,
  sortOrder,
  sortOptions = [], // Tablica [{ value: 'date', label: 'Data' }, ...]
  onSortChange,
  onOrderToggle,
  onClear,
  children,
}) => {
  const { t } = useTranslation("common");

  return (
    <div className="filter-bar">
      {/* SEKCJA FILTRÓW (LEWA) */}
      <div className="filters-area">
        <div className="filters-icon-wrapper">
          <Filter size={18} />
        </div>
        {/* Tu renderowane są children (inne filtry). 
            Jeśli w children też są <select>, musisz je podmienić w rodzicu (AdminInternalSupport). */}
        {children}
      </div>

      {/* SEKCJA SORTOWANIA (PRAWA) */}
      <div className="actions-area">
        {sortOptions.length > 0 && (
          <div className="sort-group">
            <span className="sort-label">{t("filters.label")}</span>

            {/* PODMIANA: Zamiast <select> używamy <Select> */}
            {/* Musimy nadać mu stałą szerokość lub klasę, żeby się nie rozjeżdżał */}
            <div style={{ minWidth: "180px" }}>
              <Select
                value={sortBy}
                onChange={(val) => onSortChange(val)} // Select zwraca wartość bezpośrednio
                options={sortOptions}
                placeholder={t("filters.label")} // Lub inny tekst
              />
            </div>

            <button
              className="sort-order-btn"
              onClick={onOrderToggle}
              title={
                sortOrder === "asc"
                  ? t("filters.ascending")
                  : t("filters.descending")
              }
            >
              {sortOrder === "asc" ? (
                <ArrowUp size={18} />
              ) : (
                <ArrowDown size={18} />
              )}
            </button>
          </div>
        )}

        <div className="divider"></div>

        <Button
          variant="accent"
          size="sm"
          onClick={onClear}
          className="clear-btn"
        >
          {t("filters.clear")}
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;
