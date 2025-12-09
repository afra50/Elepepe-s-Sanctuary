import React from "react";
import { Search, X } from "lucide-react";

const SearchBar = ({ value, onChange, onClear, placeholder = "Szukaj..." }) => {
  return (
    <div className="search-bar">
      <Search size={18} className="search-icon" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      {value && (
        <button className="clear-btn" onClick={onClear} type="button">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
