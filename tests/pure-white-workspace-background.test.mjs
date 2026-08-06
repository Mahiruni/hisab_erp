import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/biloo-pure-white-workspace-lock.css", import.meta.url), "utf8");

test("pure white workspace lock loads after all other authenticated theme authorities", () => {
  const whiteLock = layout.indexOf('import "./biloo-pure-white-workspace-lock.css";');
  const interactionLock = layout.indexOf('import "./biloo-workspace-utility-visibility-lock.css";');
  const contrastLock = layout.indexOf('import "./biloo-all-workspace-routes-contrast-lock.css";');

  assert.ok(whiteLock > interactionLock);
  assert.ok(whiteLock > contrastLock);
});

test("authenticated canvases are pure white and decorative page washes are removed", () => {
  assert.match(css, /\.erp-shell\s*\{[\s\S]*background-color:\s*#ffffff\s*!important;/i);
  assert.match(css, /\.erp-shell\s*>\s*\.workspace\s*\{[\s\S]*background:\s*#ffffff\s*!important;/i);
  assert.match(css, /background-image:\s*none\s*!important;/i);

  for (const selector of [
    ".dashboard-content",
    ".section-page",
    ".module-page-modern",
    ".finance-page",
    ".sales-page",
    ".einvoice-page",
    ".recon-page",
    ".core-page",
    ".guided-setup-page",
    ".controls-page",
    ".security-account-page",
    ".billing-page",
    ".checkout-page",
  ]) {
    assert.ok(css.includes(selector), `missing white canvas selector ${selector}`);
  }
});

test("brand contrast surfaces remain intentional while ordinary cards stay neutral", () => {
  assert.ok(css.includes(".finance-hero"));
  assert.ok(css.includes("background-color: #14213d !important"));
  assert.ok(css.includes(".workspace-section"));
  assert.ok(css.includes(".dashboard-card"));
  assert.ok(css.includes("background-color: #ffffff !important"));
});

test("mobile and print canvases remain white", () => {
  assert.match(css, /@media\s*\(max-width:\s*960px\)/i);
  assert.match(css, /@media\s*print/i);
});
