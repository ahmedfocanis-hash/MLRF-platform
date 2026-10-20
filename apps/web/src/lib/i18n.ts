import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ar } from '../locales/ar';
import { en } from '../locales/en';

const stored = localStorage.getItem('mlrf-lang');
const initial = stored === 'ar' ? 'ar' : 'en';

function applyDocumentLanguage(language: string) {
  const lng = language.startsWith('ar') ? 'ar' : 'en';
  localStorage.setItem('mlrf-lang', lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.title = lng === 'ar' ? ar.documentTitle : en.documentTitle;
}

applyDocumentLanguage(initial);

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: initial,
  fallbackLng: 'en',
  nsSeparator: false,
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', applyDocumentLanguage);

export default i18n;
