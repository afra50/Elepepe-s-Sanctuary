import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enHeader from "./locales/en/header.json";
import plHeader from "./locales/pl/header.json";
import esHeader from "./locales/es/header.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { header: enHeader },
    pl: { header: plHeader },
    es: { header: esHeader },
  },
  lng: "en", // domyślny język
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
