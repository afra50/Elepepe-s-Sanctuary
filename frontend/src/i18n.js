import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector"; // <--- 1. IMPORT

import enHeader from "./locales/en/header.json";
import plHeader from "./locales/pl/header.json";
import esHeader from "./locales/es/header.json";
import enFooter from "./locales/en/footer.json";
import plFooter from "./locales/pl/footer.json";
import esFooter from "./locales/es/footer.json";
import enContact from "./locales/en/contact.json";
import plContact from "./locales/pl/contact.json";
import esContact from "./locales/es/contact.json";
import plHome from "./locales/pl/home.json";
import enHome from "./locales/en/home.json";
import esHome from "./locales/es/home.json";
import plNotFound from "./locales/pl/notFound.json";
import enNotFound from "./locales/en/notFound.json";
import esNotFound from "./locales/es/notFound.json";
import plLogin from "./locales/pl/login.json";
import enLogin from "./locales/en/login.json";
import esLogin from "./locales/es/login.json";
import plRequest from "./locales/pl/request.json";

import plAdmin from "./locales/pl/admin.json";
import enAdmin from "./locales/en/admin.json";
import esAdmin from "./locales/es/admin.json";

i18n
  // Wykrywa język użytkownika (z localStorage, przeglądarki itp.)
  .use(LanguageDetector) // <--- 2. UŻYCIE DETEKTORA
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        header: enHeader,
        footer: enFooter,
        contact: enContact,
        home: enHome,
        notFound: enNotFound,
        login: enLogin,
        admin: enAdmin,
      },
      pl: {
        header: plHeader,
        footer: plFooter,
        home: plHome,
        request: plRequest,
        contact: plContact,
        notFound: plNotFound,
        login: plLogin,
        admin: plAdmin,
      },
      es: {
        header: esHeader,
        footer: esFooter,
        contact: esContact,
        home: esHome,
        notFound: esNotFound,
        login: esLogin,
        admin: esAdmin,
      },
    },
    fallbackLng: "en", // Język zapasowy zostaje (używany, gdy detekcja zawiedzie)

    // Opcjonalnie: konfiguracja detekcji
    detection: {
      order: ["localStorage", "navigator"], // Najpierw sprawdź localStorage, potem język przeglądarki
      caches: ["localStorage"], // Gdzie zapisywać wybór użytkownika
    },

    interpolation: { escapeValue: false },
  });

export default i18n;
