import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");

async function walk(dir) {
  const absolute = path.join(root, dir);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(relative));
    else files.push(relative);
  }
  return files;
}

test("every public marketing route uses the shared page shell", async () => {
  const files = (await walk("app")).filter((file) => file.endsWith("/page.tsx") || file === "app/page.tsx");
  const publicMarkers = [
    "marketing-eyebrow", "marketing-section", "about-hero", "pricing-hero", "industry-index-hero",
    "integration-page-hero", "migration-hero", "trust-page-hero", "resources-hero", "comparison-hub-hero",
    "help-public-hero", "product-tour-hero", "demo-request-page",
  ];

  for (const file of files) {
    const source = await read(file);
    if (!publicMarkers.some((marker) => source.includes(marker))) continue;
    assert.match(source, /MarketingPageShell/, `${file} bypasses the shared marketing shell`);
  }
});

test("header supports hover, focus, click and keyboard-safe menu disclosure", async () => {
  const chrome = await read("components/marketing-site-chrome.tsx");
  assert.match(chrome, /onMouseEnter=\{\(\) => openFromHover\(group\.id\)\}/);
  assert.match(chrome, /onMouseLeave=\{scheduleHoverClose\}/);
  assert.match(chrome, /onFocus=\{\(\) => setOpenMenu\(group\.id\)\}/);
  assert.match(chrome, /aria-expanded=\{expanded\}/);
  assert.match(chrome, /event\.key !== "Escape"/);
});

test("primary and secondary controls keep readable text in normal and hover states", async () => {
  const core = await read("app/hisab-marketing.css");
  const routes = await read("app/marketing-routes.css");
  const production = await read("app/marketing-production.css");
  const css = `${core}\n${routes}\n${production}`;

  for (const selector of [
    ".hisab .h-btn--primary",
    ".hisab .marketing-start",
    ".hisab .h-btn--ghost",
    ".hisab .marketing-demo",
    ".hisab .h-nav__trigger:hover",
    ".hisab .h-nav__item:hover",
  ]) {
    assert.ok(css.includes(selector), `missing control selector: ${selector}`);
  }

  assert.match(css, /-webkit-text-fill-color:\s*#fff/);
  assert.match(css, /\.hisab \.marketing-demo:hover[\s\S]*?color:\s*var\(--signal-700\)/);
});

test("all literal public-route class names have stylesheet coverage", async () => {
  const core = await read("app/hisab-marketing.css");
  const routes = await read("app/marketing-routes.css");
  const production = await read("app/marketing-production.css");
  const css = `${core}\n${routes}\n${production}`;
  const files = ["components/marketing-home.tsx", "components/marketing-site-chrome.tsx"];

  for (const file of await walk("app")) {
    if (!file.endsWith("/page.tsx") && file !== "app/page.tsx") continue;
    const source = await read(file);
    if (source.includes("MarketingPageShell")) files.push(file);
  }

  const missing = new Set();
  for (const file of files) {
    const source = await read(file);
    for (const match of source.matchAll(/className\s*=\s*["']([^"']+)["']/g)) {
      for (const className of match[1].split(/\s+/).filter(Boolean)) {
        if (className.includes("${")) continue;
        if (!css.includes(`.${className}`) && !css.includes(`[class*="${className}`)) missing.add(className);
      }
    }
  }

  assert.deepEqual([...missing].sort(), []);
});
