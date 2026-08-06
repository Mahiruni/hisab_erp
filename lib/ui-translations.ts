import catalog01 from "./locales/ui-catalog-01.json";
import catalog02 from "./locales/ui-catalog-02.json";
import catalog03 from "./locales/ui-catalog-03.json";
import catalog04 from "./locales/ui-catalog-04.json";
import catalog05 from "./locales/ui-catalog-05.json";
import catalog06 from "./locales/ui-catalog-06.json";
import catalog07 from "./locales/ui-catalog-07.json";
import catalog08 from "./locales/ui-catalog-08.json";
import catalog09 from "./locales/ui-catalog-09.json";
import catalog10 from "./locales/ui-catalog-10.json";
import catalog11 from "./locales/ui-catalog-11.json";
import catalog12 from "./locales/ui-catalog-12.json";
import catalog13 from "./locales/ui-catalog-13.json";
import catalog14 from "./locales/ui-catalog-14.json";
import catalog15 from "./locales/ui-catalog-15.json";
import catalog16 from "./locales/ui-catalog-16.json";
import { translateUnknownAmharic } from "./amharic-fallback";
import { dictionaries, type SupportedLanguage as Language } from "./translations";

export type TranslationValues = ReadonlyArray<string | number> | Record<string, string | number>;

type UiCatalogEntry = { source: string; am: string };
type TranslationEntry = Record<Language, string>;
type CompiledPattern = { source: string; regex: RegExp; keys: string[]; entry: TranslationEntry };

const catalogs = [
  catalog01,
  catalog02,
  catalog03,
  catalog04,
  catalog05,
  catalog06,
  catalog07,
  catalog08,
  catalog09,
  catalog10,
  catalog11,
  catalog12,
  catalog13,
  catalog14,
  catalog15,
  catalog16,
] as UiCatalogEntry[][];
const exactTranslations = new Map<string, TranslationEntry>();
const compiledPatterns: CompiledPattern[] = [];

export function normalizeUiText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function flattenDictionary(
  english: unknown,
  amharic: unknown,
) {
  if (typeof english === "string") {
    const source = normalizeUiText(english);
    if (!source) return;
    exactTranslations.set(source, {
      en: source,
      am: typeof amharic === "string" ? normalizeUiText(amharic) : source,
    });
    return;
  }

  if (Array.isArray(english)) {
    english.forEach((value, index) => {
      flattenDictionary(
        value,
        Array.isArray(amharic) ? amharic[index] : undefined,
      );
    });
    return;
  }

  if (english && typeof english === "object") {
    Object.entries(english as Record<string, unknown>).forEach(([key, value]) => {
      const amValue = amharic && typeof amharic === "object"
        ? (amharic as Record<string, unknown>)[key]
        : undefined;
      flattenDictionary(value, amValue);
    });
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compilePattern(source: string, entry: TranslationEntry) {
  const keys: string[] = [];
  const parts = source.split(/(\{[A-Za-z0-9_]+\})/g);
  const regexSource = parts.map((part) => {
    const match = part.match(/^\{([A-Za-z0-9_]+)\}$/);
    if (!match) return escapeRegExp(part);
    keys.push(match[1]);
    return "(.+?)";
  }).join("");
  compiledPatterns.push({ source, regex: new RegExp(`^${regexSource}$`), keys, entry });
}

function registerEntry(entry: TranslationEntry) {
  const source = normalizeUiText(entry.en);
  if (!source) return;
  const normalized = {
    en: source,
    am: normalizeUiText(entry.am) || source,
  } satisfies TranslationEntry;
  exactTranslations.set(source, normalized);
  if (/\{[A-Za-z0-9_]+\}/.test(source)) compilePattern(source, normalized);
}

flattenDictionary(dictionaries.en, dictionaries.am);
for (const catalog of catalogs) {
  for (const item of catalog) registerEntry({ en: item.source, am: item.am });
}

function interpolate(template: string, values: TranslationValues | undefined) {
  if (!values) return template;
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (token, key: string) => {
    const value = Array.isArray(values)
      ? values[Number(key)]
      : (values as Record<string, string | number>)[key];
    return value === undefined ? token : String(value);
  });
}

function matchPattern(source: string, language: Language) {
  for (const pattern of compiledPatterns) {
    const match = source.match(pattern.regex);
    if (!match) continue;
    const values: Record<string, string> = {};
    pattern.keys.forEach((key, index) => { values[key] = match[index + 1]; });
    return interpolate(pattern.entry[language], values);
  }
  return null;
}

export function translateUiText(
  sourceText: string,
  language: Language,
  values?: TranslationValues,
) {
  if (!sourceText) return sourceText;
  const normalized = normalizeUiText(sourceText);
  if (!normalized) return sourceText;

  const direct = exactTranslations.get(normalized);
  const patternTranslation = matchPattern(normalized, language);
  const translated = direct
    ? interpolate(direct[language], values)
    : patternTranslation ?? (language === "am" ? translateUnknownAmharic(normalized) : normalized);

  const leading = sourceText.match(/^\s*/)?.[0] ?? "";
  const trailing = sourceText.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

export function hasUiTranslation(sourceText: string) {
  const normalized = normalizeUiText(sourceText);
  if (exactTranslations.has(normalized)) return true;
  if (compiledPatterns.some((pattern) => pattern.regex.test(normalized))) return true;
  return /[A-Za-z]/.test(normalized);
}

export const uiTranslationStats = Object.freeze({
  catalogEntries: catalogs.reduce((count, catalog) => count + catalog.length, 0),
  totalSourceStrings: exactTranslations.size,
  languages: ["en", "am"] as const,
  fallback: "amharic-public-site-lexicon",
});
