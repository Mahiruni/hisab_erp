import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the product language selector exposes only English and Amharic", async () => {
  const provider = await read("components/language-provider.tsx");

  assert.match(provider, /\{ value: "en", short: "EN" \}/);
  assert.match(provider, /\{ value: "am", short: "አማ" \}/);
  assert.doesNotMatch(provider, /value: "ti"/);
  assert.doesNotMatch(provider, /dictionary\.language\.tigrinya/);
  assert.match(provider, /saved === "en" \|\| saved === "am"/);
});

test("server locale resolution treats removed preferences as English", async () => {
  const [layout, serverLocale] = await Promise.all([
    read("app/layout.tsx"),
    read("lib/server-locale.ts"),
  ]);

  assert.match(layout, /saved==="am"\?"am":"en"/);
  assert.match(serverLocale, /value === "am" \? "am" : "en"/);
  assert.doesNotMatch(layout, /saved==="ti"/);
  assert.doesNotMatch(serverLocale, /value === "ti"/);
});

test("the runtime and localization checks support English and Amharic only", async () => {
  const [translations, uiTranslations, buildIndex, audit, quality] = await Promise.all([
    read("lib/translations.ts"),
    read("lib/ui-translations.ts"),
    read("scripts/build-i18n-index.mjs"),
    read("scripts/i18n-audit.mjs"),
    read("scripts/translation-quality.mjs"),
  ]);

  assert.match(translations, /SupportedLanguage = Exclude<Language, "ti">/);
  assert.doesNotMatch(translations, /import ti from/);
  assert.match(uiTranslations, /languages: \["en", "am"\]/);
  assert.doesNotMatch(uiTranslations, /dictionaries\.ti/);
  assert.doesNotMatch(buildIndex, /ui\.ti\.json/);
  assert.doesNotMatch(audit, /locales\/ti\.json/);
  assert.match(quality, /requiredLanguages: \["am"\]/);

  await assert.rejects(access(new URL("../lib/locales/ti.json", import.meta.url)));
});
