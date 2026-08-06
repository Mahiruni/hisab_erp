export type PublicLanguage = "en" | "am";
export type LocalizedText = Readonly<{ en: string; am: string }>;

/**
 * Public marketing HTML is emitted in English so it can be shared from the
 * Vercel CDN. The client LanguageProvider applies the visitor's persisted
 * English or Amharic preference after hydration without making every public
 * request depend on a server cookie.
 */
export async function getPublicLanguage(): Promise<PublicLanguage> {
  return "en";
}

export function localize(value: LocalizedText, language: PublicLanguage) {
  return value[language];
}

export function localizedList(values: readonly LocalizedText[], language: PublicLanguage) {
  return values.map((value) => localize(value, language));
}
