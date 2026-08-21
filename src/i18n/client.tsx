"use client";

import { useEffect, useState } from 'react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { getOptions, languages } from './settings';
import en from '../locales/en.json';
import pt from '../locales/pt.json';
import es from '../locales/es.json';

i18next
  .use(initReactI18next)
  .init({
    ...getOptions(),
    resources: {
      en: { translation: en },
      pt: { translation: pt },
      es: { translation: es }
    },
    lng: undefined, // let it be set by provider
  });

export function I18nProvider({ children, initialLng }: { children: React.ReactNode, initialLng: string }) {
  const [lng, setLng] = useState(initialLng);

  useEffect(() => {
    if (initialLng !== i18next.language) {
      i18next.changeLanguage(initialLng);
    }
  }, [initialLng]);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
