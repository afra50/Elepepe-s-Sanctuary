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
import plAbout from "./locales/pl/about.json";
import enAbout from "./locales/en/about.json";
import esAbout from "./locales/es/about.json";
import plNotFound from "./locales/pl/notFound.json";
import enNotFound from "./locales/en/notFound.json";
import esNotFound from "./locales/es/notFound.json";
import plLogin from "./locales/pl/login.json";
import enLogin from "./locales/en/login.json";
import esLogin from "./locales/es/login.json";
import plRequest from "./locales/pl/request.json";
import enRequest from "./locales/en/request.json";
import esRequest from "./locales/es/request.json";
import plAdmin from "./locales/pl/admin.json";
import enAdmin from "./locales/en/admin.json";
import esAdmin from "./locales/es/admin.json";
import plCommon from "./locales/pl/common.json";
import enCommon from "./locales/en/common.json";
import esCommon from "./locales/es/common.json";
import plProjects from "./locales/pl/projects.json";
import enProjects from "./locales/en/projects.json";
import esProjects from "./locales/es/projects.json";
import plPartners from "./locales/pl/partnerships.json";
import enPartners from "./locales/en/partnerships.json";
import esPartners from "./locales/es/partnerships.json";
import plProjectDetails from "./locales/pl/projectDetails.json";
import enProjectDetails from "./locales/en/projectDetails.json";
import esProjectDetails from "./locales/es/projectDetails.json";

i18n
  // Wykrywa język użytkownika (z localStorage, przeglądarki itp.)
  .use(LanguageDetector) // <--- 2. UŻYCIE DETEKTORA
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        header: enHeader,
        footer: enFooter,
        request: enRequest,
        contact: enContact,
        home: enHome,
        about: enAbout,
        notFound: enNotFound,
        login: enLogin,
        admin: enAdmin,
        common: enCommon,
        projects: enProjects,
        partnerships: enPartners,
        projectDetails: enProjectDetails,
      },
      pl: {
        header: plHeader,
        footer: plFooter,
        home: plHome,
        about: plAbout,
        request: plRequest,
        contact: plContact,
        notFound: plNotFound,
        login: plLogin,
        admin: plAdmin,
        common: plCommon,
        projects: plProjects,
        partnerships: plPartners,
        projectDetails: plProjectDetails,
      },
      es: {
        header: esHeader,
        footer: esFooter,
        request: esRequest,
        contact: esContact,
        home: esHome,
        about: esAbout,
        notFound: esNotFound,
        login: esLogin,
        admin: esAdmin,
        common: esCommon,
        projects: esProjects,
        partnerships: esPartners,
        projectDetails: esProjectDetails,
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
