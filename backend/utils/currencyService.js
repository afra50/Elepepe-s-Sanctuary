// backend/utils/currencyService.js
const axios = require("axios");

/**
 * Converts an amount from one currency to another using current exchange rates.
 * Uses the free Frankfurter API (ECB data).
 * * @param {number} amount - The amount to convert.
 * @param {string} fromCurrency - Source currency code (e.g., 'PLN').
 * @param {string} toCurrency - Target currency code (e.g., 'EUR').
 * @returns {Promise<number>} - The converted amount.
 */
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  // 1. Optimization: If currencies are the same, return original amount immediately
  if (fromCurrency === toCurrency) {
    return parseFloat(amount);
  }

  try {
    // API Request construction
    // Example: https://api.frankfurter.app/latest?amount=100&from=PLN&to=EUR
    const url = `https://api.frankfurter.app/latest?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`;

    const response = await axios.get(url);

    // The API returns an object like: { amount: 100, base: 'PLN', date: '...', rates: { EUR: 23.45 } }
    const convertedAmount = response.data.rates[toCurrency];

    if (!convertedAmount) {
      throw new Error(
        `Exchange rate not found for pair ${fromCurrency}-${toCurrency}`
      );
    }

    return convertedAmount;
  } catch (error) {
    // Log the detailed error internally for debugging
    console.error(
      `Currency conversion error (${fromCurrency} -> ${toCurrency}):`,
      error.message
    );

    // Throw a generic, user-friendly error message in English
    throw new Error(
      "Failed to retrieve current currency exchange rates. Please try again later."
    );
  }
};

module.exports = { convertCurrency };
