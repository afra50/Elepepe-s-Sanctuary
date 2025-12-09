import axios from "axios";

// Ustalenie adresu backendu (zmienna środowiskowa lub lokalny)
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Tworzymy instancję axiosa
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // KLUCZOWE: Pozwala przesyłać ciasteczka (httpOnly)
  headers: {
    "Content-Type": "application/json",
  },
});

// Zmienna zapobiegająca pętli nieskończonej przy odświeżaniu
let isRefreshing = false;
let failedQueue = [];

// Funkcja pomocnicza do kolejkowania zapytań, które przyszły w trakcie odświeżania tokena
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// --- INTERCEPTOR ODPOWIEDZI ---
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Jeśli błąd to 401 (Unauthorized) i nie była to próba odświeżenia tokena (_retry)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Jeśli to endpoint logowania lub odświeżania zwrócił 401, to znaczy, że po prostu nie mamy dostępu -> wyloguj
      if (
        originalRequest.url.includes("/auth/login") ||
        originalRequest.url.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Jeśli odświeżanie już trwa, dodaj to zapytanie do kolejki i czekaj
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Próba odświeżenia tokena
        await api.post("/auth/refresh");

        // Jeśli się uda, przetwarzamy kolejkę oczekujących zapytań
        processQueue(null);
        isRefreshing = false;

        // I ponawiamy to, które się nie udało
        return api(originalRequest);
      } catch (refreshError) {
        // Jeśli refresh też się nie udał (np. token wygasł definitywnie)
        processQueue(refreshError, null);
        isRefreshing = false;

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helpers dla partnerów – będziesz ich używać w panelu admina
 * (formularze będą wysyłać FormData z polem "logo")
 */

// wyciągamy origin z BASE_URL (czyli bez końcówki /api)
const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, "");

// Zwracam też stałą do ewentualnego użycia przy obrazkach w innych miejscach
export const FILES_BASE_URL = API_ORIGIN;

// ---- PARTNERS API ----
export const partnersApi = {
  getAll: () => api.get("/partners"),

  create: (formData) =>
    api.post("/partners", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id, formData) =>
    api.put(`/partners/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  delete: (id) => api.delete(`/partners/${id}`),
};

export default api;
