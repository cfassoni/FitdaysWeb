import { createInstance } from 'i18next';
import { getOptions } from './settings';
import { cookies, headers } from 'next/headers';
import acceptLanguage from 'accept-language';
import { fallbackLng, languages, cookieName } from './settings';

acceptLanguage.languages(languages);

const initI18next = async (lng: string, ns: string) => {
  const i18nInstance = createInstance();
  await i18nInstance.init({
    ...getOptions(lng, ns),
    resources: {
      en: { translation: (await import('../locales/en.json')).default },
      pt: { translation: (await import('../locales/pt.json')).default },
      es: { translation: (await import('../locales/es.json')).default },
    }
  });
  return i18nInstance;
};

export async function getServerTranslations(ns = 'translation') {
  const cookieStore = await cookies();
  const headersStore = await headers();
  let lng = fallbackLng;

  if (cookieStore.has(cookieName)) {
    lng = acceptLanguage.get(cookieStore.get(cookieName)?.value) || fallbackLng;
  } else if (headersStore.has('accept-language')) {
    lng = acceptLanguage.get(headersStore.get('accept-language')) || fallbackLng;
  }

  const i18nextInstance = await initI18next(lng, ns);
  
  return {
    t: i18nextInstance.getFixedT(lng, ns),
    i18n: i18nextInstance,
    lng
  };
}
