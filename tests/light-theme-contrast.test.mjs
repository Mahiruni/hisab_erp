import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssPath = new URL("../app/light-theme-contrast.css", import.meta.url);
const guardPath = new URL("../app/light-theme-component-guards.css", import.meta.url);
const layoutPath = new URL("../app/layout.tsx", import.meta.url);

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const value = hex.replace("#", "");
  const [red, green, blue] = [0, 2, 4].map((offset) => channel(Number.parseInt(value.slice(offset, offset + 2), 16)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("loads both contrast layers after every legacy and workspace stylesheet", async () => {
  const layout = await readFile(layoutPath, "utf8");
  const contrastImport = layout.indexOf('import "./light-theme-contrast.css";');
  const guardImport = layout.indexOf('import "./light-theme-component-guards.css";');
  const previousImport = layout.indexOf('import "./workspace-header-preferences.css";');

  assert.ok(contrastImport > previousImport, "contrast overrides must load after header and legacy styles");
  assert.ok(guardImport > contrastImport, "component guards must load after the semantic contrast layer");
  assert.equal(layout.slice(guardImport).match(/import "\.\/.*\.css";/g)?.length, 1, "component guards must remain the final CSS import");
});

test("scopes the correction to light mode and preserves the dark navigation rail", async () => {
  const css = await readFile(cssPath, "utf8");
  const guards = await readFile(guardPath, "utf8");

  assert.match(css, /html\[data-theme="light"\]/);
  assert.match(css, /color-scheme:\s*light/);
  assert.match(css, /Preserve the intentionally dark navigation rail/);
  assert.match(css, /\.erp-shell > \.sidebar/);
  assert.doesNotMatch(`${css}\n${guards}`, /html\[data-theme="dark"\]/, "the correction layers must not mutate dark mode");
});

test("covers all high-risk light-mode UI surfaces", async () => {
  const css = await readFile(cssPath, "utf8");
  const guards = await readFile(guardPath, "utf8");
  const combined = `${css}\n${guards}`;

  for (const selector of [
    ".dashboard-content",
    ".finance-page",
    ".sales-page",
    ".ops-page",
    ".controls-page",
    ".guided-setup-page",
    ".module-page",
    ".einvoice-page",
    ".recon-page",
    ".account-security-page",
    ".help-center-page",
    ".workspace-command-header",
    ".workspace-header-preferences-popover",
    ".sticky-user-popover",
    ".auth-official-page",
    ".auth-official-showcase",
  ]) {
    assert.ok(combined.includes(selector), `missing light-mode coverage for ${selector}`);
  }

  assert.match(css, /button\[type="submit"\]\.primary/);
  assert.match(css, /table tbody tr:hover td/);
  assert.match(css, /input:not\(\[type="checkbox"\]\)/);
  assert.match(css, /\[aria-disabled="true"\]/);
  assert.match(css, /button:is\(\.active, \[aria-selected="true"\], \[aria-current="page"\]\)/);
  assert.match(guards, /Solid actions must keep inverse text/);
  assert.match(guards, /Restore semantic status fills/);
  assert.match(guards, /\.ops-progress-ring::after/);
});

test("semantic light palette meets WCAG AA contrast for normal text", () => {
  const pairs = [
    ["#ffffff", "#172033", "primary text"],
    ["#ffffff", "#5b6678", "muted text"],
    ["#0f766e", "#ffffff", "primary action"],
    ["#b4233d", "#ffffff", "destructive action"],
    ["#fff7e6", "#8a4b08", "warning state"],
    ["#e8f7f3", "#0b5f59", "success state"],
    ["#eff6ff", "#1d4ed8", "information state"],
  ];

  for (const [background, foreground, label] of pairs) {
    assert.ok(
      contrastRatio(background, foreground) >= 4.5,
      `${label} contrast must be at least 4.5:1`,
    );
  }
});
