// src/utils/dateUtils.js

/**
 * Formatuje datę (np. ISO) na czytelny format (np. DD.MM.YYYY)
 * @param {string | Date} dateString - Data do sformatowania
 * @param {string} locale - Kod języka (domyślnie 'pl-PL')
 * @returns {string} Sformatowana data
 */
export const formatDate = (dateString, locale = "pl-PL") => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  // Sprawdzenie czy data jest poprawna
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
