export const SUPPORTED_LANGUAGES = ['en', 'pt', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function resolveLanguage(
  cookieLang?: string | null,
  acceptLangHeader?: string | null
): SupportedLanguage {
  if (cookieLang && (SUPPORTED_LANGUAGES as readonly string[]).includes(cookieLang)) {
    return cookieLang as SupportedLanguage;
  }
  if (acceptLangHeader) {
    const cleanHeader = acceptLangHeader.toLowerCase();
    if (
      cleanHeader.startsWith('pt') ||
      cleanHeader.includes(',pt') ||
      cleanHeader.includes('pt-')
    ) {
      return 'pt';
    }
    if (
      cleanHeader.startsWith('es') ||
      cleanHeader.includes(',es') ||
      cleanHeader.includes('es-')
    ) {
      return 'es';
    }
  }
  return 'en';
}
