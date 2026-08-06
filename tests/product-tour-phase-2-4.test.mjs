import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("Phase 2.4 product tour keeps the Hisab brand and isolated route styling", async () => {
  const [page, experience, styles] = await Promise.all([
    read("app/product-tour/page.tsx"),
    read("components/product-tour-experience.tsx"),
    read("app/product-tour/product-tour-phase-2-4.css"),
  ]);

  assert.match(page, /title: "Hisab ERP Product Tour"/);
  assert.match(page, /import "\.\/product-tour-phase-2-4\.css"/);
  assert.match(page, /className="product-tour-phase-2-4"/);
  assert.doesNotMatch(page, /Interactive HisabERP product tour/);

  assert.match(experience, /role="tablist"/);
  assert.match(experience, /event\.key === "ArrowRight"/);
  assert.match(experience, /event\.key === "Home"/);
  assert.match(experience, /event\.key === "End"/);
  assert.match(experience, /className="tour-macbook"/);
  assert.match(experience, /className="tour-iphone"/);
  assert.match(experience, /aria-live="polite"/);
  assert.match(experience, /Show previous product area/);
  assert.match(experience, /Show next product area/);

  assert.match(styles, /^\.product-tour-phase-2-4/m);
  assert.match(styles, /font-family: -apple-system/);
  assert.match(styles, /\.product-tour-phase-2-4 \.tour-macbook-base/);
  assert.match(styles, /\.product-tour-phase-2-4 \.tour-iphone/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(max-width: 720px\)/);
});
