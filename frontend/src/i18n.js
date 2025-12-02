import i18n from "i18next";
import { initReactI18next } from "react-i18next";

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

i18n.use(initReactI18next).init({
  resources: {
    en: {
      header: enHeader,
      footer: enFooter,
      contact: enContact,
      home: enHome,
    },
    pl: {
      header: plHeader,
      footer: plFooter,
      home: plHome,
      contact: plContact,
    },
    es: {
      header: esHeader,
      footer: esFooter,
      contact: esContact,
      home: esHome,
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
