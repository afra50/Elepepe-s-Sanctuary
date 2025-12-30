import React from "react";
import { ArrowUp, ArrowDown, Filter } from "lucide-react";
import Button from "./Button";
import { useTranslation } from "react-i18next"; // <--- 1. Import

const FilterBar = ({
  sortBy,
  sortOrder,
  sortOptions = [],
  onSortChange,
  onOrderToggle,
  // clearLabel, // <--- Możesz to usunąć, jeśli będziemy brać z tłumaczeń wewnątrz
  onClear,
  children,
}) => {
  const { t } = useTranslation("common"); // <--- 2. Hook (namespace 'common')

  return (
    <div className="filter-bar">
      {/* SEKCJA FILTRÓW */}
      <div className="filters-area">
        <div className="filters-icon-wrapper">
          <Filter size={18} />
        </div>
        {children}
      </div>

      {/* SEKCJA SORTOWANIA i CZYSZCZENIA */}
      <div className="actions-area">
        {sortOptions.length > 0 && (
          <div className="sort-group">
            {/* Tłumaczenie etykiety */}
            <span className="sort-label">{t("filters.label")}</span>

            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="sort-select"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {/* Zakładam, że opt.label jest już przetłumaczone przez rodzica, 
                      ALE jeśli przekazujesz tam tylko klucze (np. 'date'), 
                      możesz tu zrobić: t(`filters.sortOptions.${opt.value}`) */}
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              className="sort-order-btn"
              onClick={onOrderToggle}
              // Tłumaczenie tytułów (tooltipów)
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
          {/* Tłumaczenie przycisku czyszczenia */}
          {t("filters.clear")}
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;
