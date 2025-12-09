import React from "react";
import { ArrowUp, ArrowDown, Filter, X } from "lucide-react";
import Button from "./Button"; // Upewnij się, że ścieżka jest poprawna

const FilterBar = ({
  // Sortowanie
  sortBy,
  sortOrder, // 'asc' | 'desc'
  sortOptions = [], // Tablica: [{ value: 'date', label: 'Data' }]
  onSortChange,
  onOrderToggle,
  clearLabel,

  // Akcje
  onClear,

  // Specyficzne filtry (przekazane jako dzieci)
  children,
}) => {
  return (
    <div className="filter-bar">
      {/* SEKCJA FILTRÓW (Dropdowny) */}
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
            <span className="sort-label">Sortuj:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="sort-select"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              className="sort-order-btn"
              onClick={onOrderToggle}
              title={sortOrder === "asc" ? "Rosnąco" : "Malejąco"}
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
          {clearLabel}
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;
