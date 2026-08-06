import "server-only";

import { cookies } from "next/headers";
import type { SupportedLanguage as Language } from "./translations";
import { translateUiText, type TranslationValues } from "./ui-translations";

export async function getRequestLanguage(): Promise<Language> {
  const value = (await cookies()).get("hisab_locale")?.value;
  return value === "am" ? "am" : "en";
}

export async function getServerTranslator() {
  const language = await getRequestLanguage();
  return {
    language,
    t(source: string, values?: TranslationValues) {
      return translateUiText(source, language, values);
    },
  };
}
