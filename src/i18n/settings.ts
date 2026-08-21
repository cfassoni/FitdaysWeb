export const fallbackLng = 'pt';
export const languages = ['en', 'pt', 'es'];
export const defaultNS = 'translation';
export const cookieName = 'NEXT_LOCALE';

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns
  };
}
