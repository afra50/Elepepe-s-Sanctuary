import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enHeader from "./locales/en/header.json";
import plHeader from "./locales/pl/header.json";
import esHeader from "./locales/es/header.json";
import enFooter from "./locales/en/footer.json";
import plFooter from "./locales/pl/footer.json";
import esFooter from "./locales/es/footer.json";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      header: enHeader,
      footer: enFooter,
    },
    pl: {
      header: plHeader,
      footer: plFooter,
    },
    es: {
      header: esHeader,
      footer: esFooter,
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
