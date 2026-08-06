import { promises as fs } from "node:fs";
import path from "node:path";

const localeDir = path.join("lib", "locales");
const files = (await fs.readdir(localeDir))
  .filter((file) => /^ui-catalog-\d+\.json$/.test(file))
  .sort();

if (!files.length) throw new Error("No UI translation catalogs were found.");

const english = {};
const amharic = {};
const sourceLocations = new Map();
const invalidDuplicates = [];
const invalidOverrides = [];
const appliedOverrides = [];

for (const file of files) {
  const entries = JSON.parse(await fs.readFile(path.join(localeDir, file), "utf8"));
  if (!Array.isArray(entries)) throw new Error(`${file} must contain an array.`);

  for (const [index, entry] of entries.entries()) {
    const source = String(entry?.source ?? "").replace(/\s+/g, " ").trim();
    const am = String(entry?.am ?? "").replace(/\s+/g, " ").trim();
    const location = `${file}[${index}]`;
    if (!source || !am) throw new Error(`${file} contains an incomplete English or Amharic translation entry.`);

    const previous = sourceLocations.get(source);
    if (previous && entry?.override !== true) invalidDuplicates.push(`${location} duplicates ${previous}`);
    if (!previous && entry?.override === true) invalidOverrides.push(`${location} does not override an earlier source`);
    if (previous && entry?.override === true) {
      const reviewNote = String(entry?.reviewNote ?? "").trim();
      if (!reviewNote) invalidOverrides.push(`${location} requires reviewNote`);
      appliedOverrides.push({ source, from: previous, to: location, reviewNote });
    }

    sourceLocations.set(source, location);
    english[source] = source;
    amharic[source] = am;
  }
}

if (invalidDuplicates.length) throw new Error(`Duplicate UI translation sources: ${invalidDuplicates.join("; ")}`);
if (invalidOverrides.length) throw new Error(`Invalid UI translation overrides: ${invalidOverrides.join("; ")}`);

await Promise.all([
  fs.writeFile(path.join(localeDir, "ui.en.json"), `${JSON.stringify(english)}\n`),
  fs.writeFile(path.join(localeDir, "ui.am.json"), `${JSON.stringify(amharic)}\n`),
  fs.writeFile("translation-overrides-report.json", `${JSON.stringify({ generatedAt: new Date().toISOString(), appliedOverrides }, null, 2)}\n`),
]);

console.log(`Generated English and Amharic localization indexes for ${Object.keys(english).length} UI strings from ${files.length} catalogs with ${appliedOverrides.length} reviewed override(s).`);
