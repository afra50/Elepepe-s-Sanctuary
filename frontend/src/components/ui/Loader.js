import React from "react";
// Upewnij się, że ten plik SCSS jest importowany w pliku głównym (np. App.scss)
// lub odkomentuj linię poniżej, jeśli używasz modułów CSS/SCSS per komponent:
// import "../../styles/_loader.scss";

const Loader = ({
  size = "md", // "sm" | "md" | "lg"
  variant = "inline", // "inline" | "global" | "center"
  text = null,
  className = "",
}) => {
  // Budujemy string z klasami bazowymi
  const baseClass = `loader loader--${size} ${className}`;

  // 1. Wariant GLOBALNY (cały ekran)
  if (variant === "global") {
    return (
      <div className="loader-overlay">
        <div className={baseClass} role="status" aria-label="Loading" />
        {text && <p className="loader-text">{text}</p>}
      </div>
    );
  }

  // 2. Wariant CENTER (wyśrodkowany w kontenerze)
  if (variant === "center") {
    return (
      <div className="loader-center">
        <div className={baseClass} role="status" aria-label="Loading" />
      </div>
    );
  }

  // 3. Wariant INLINE (domyślny)
  return <div className={baseClass} role="status" aria-label="Loading" />;
};

export default Loader;
