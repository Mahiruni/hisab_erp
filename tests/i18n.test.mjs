import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("UI translation catalogs are complete and unique", async () => {
  const localeUrl = new URL("../lib/locales/", import.meta.url);
  const files = (await readdir(localeUrl)).filter((file) => /^ui-catalog-\d+\.json$/.test(file)).sort();
  assert.equal(files.length, 4);

  const sources = new Set();
  let count = 0;
  for (const file of files) {
    const entries = JSON.parse(await read(`lib/locales/${file}`));
    assert.ok(Array.isArray(entries));
    for (const entry of entries) {
      assert.equal(typeof entry.source, "string");
      assert.ok(entry.source.trim());
      assert.equal(typeof entry.am, "string");
      assert.ok(entry.am.trim());
      assert.equal(typeof entry.ti, "string");
      assert.ok(entry.ti.trim());
      assert.equal(sources.has(entry.source), false, `duplicate source: ${entry.source}`);
      sources.add(entry.source);
      count += 1;
    }
  }
  assert.equal(count, 556);
});

test("language provider automatically localizes current and future interface content", async () => {
  const [provider, runtime] = await Promise.all([
    read("components/language-provider.tsx"),
    read("lib/ui-translations.ts"),
  ]);
  assert.match(provider, /MutationObserver/);
  assert.match(provider, /NodeFilter\.SHOW_ELEMENT \| NodeFilter\.SHOW_TEXT/);
  assert.match(provider, /placeholder.*title.*aria-label.*alt/s);
  assert.match(provider, /data-i18n-skip/);
  assert.match(provider, /translateUiText/);
  assert.match(runtime, /ui-catalog-01\.json/);
  assert.match(runtime, /ui-catalog-04\.json/);
  assert.match(runtime, /compiledPatterns/);
});

test("CI blocks untranslated visible UI copy", async () => {
  const [packageJson, workflow, audit] = await Promise.all([
    read("package.json"),
    read(".github/workflows/ci.yml"),
    read("scripts/i18n-audit.mjs"),
  ]);
  assert.match(packageJson, /"i18n:check"/);
  assert.match(workflow, /Localization coverage/);
  assert.match(workflow, /npm run i18n:check/);
  assert.match(audit, /process\.argv\.includes\("--check"\)/);
});
