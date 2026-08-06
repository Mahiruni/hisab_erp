import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("dashboard uses the local-time greeting component", async () => {
  const dashboard = await read("components/dashboard.tsx");

  assert.match(dashboard, /import \{ LocalGreeting \} from "\.\/local-greeting"/);
  assert.match(dashboard, /<LocalGreeting language=\{language\} firstName=\{snapshot\.userName\} \/>/);
});

test("local greeting covers four daily periods in English and Amharic", async () => {
  const greeting = await read("components/local-greeting.tsx");

  assert.match(greeting, /hour >= 5 && hour < 12/);
  assert.match(greeting, /hour >= 12 && hour < 17/);
  assert.match(greeting, /hour >= 17 && hour < 21/);
  assert.match(greeting, /Selam, \$\{firstName\}/);
  assert.match(greeting, /ሰላም፣ \$\{firstName\}/);
  assert.match(greeting, /wishing you a peaceful night/);
  assert.match(greeting, /መልካም ምሽት/);
});

test("local greeting is hydration safe and refreshes while the dashboard stays open", async () => {
  const greeting = await read("components/local-greeting.tsx");

  assert.match(greeting, /useState<Date \| null>\(null\)/);
  assert.match(greeting, /useEffect\(\(\) =>/);
  assert.match(greeting, /window\.setInterval\(updateLocalTime, 60_000\)/);
  assert.match(greeting, /window\.clearInterval\(timer\)/);
  assert.match(greeting, /dateTime=\{localTime\.toISOString\(\)\}/);
});
