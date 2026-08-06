import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("every authenticated workspace route uses the final Biloo contrast authority", async () => {
  const [styles, layout, shell] = await Promise.all([
    read("app/biloo-all-workspace-routes-contrast-lock.css"),
    read("app/layout.tsx"),
    read("components/workspace-shell.tsx"),
  ]);

  const routes = [
    "/modules",
    "/finance",
    "/sales",
    "/e-invoicing",
    "/reconciliation",
    "/purchasing",
    "/inventory",
    "/modules/customers-suppliers",
    "/hr",
    "/security",
    "/modules/reports-analytics",
    "/modules/localization-compliance",
    "/modules/fixed-assets",
    "/modules/budgeting-projects",
    "/modules/integrations-automation",
  ];

  for (const route of routes) assert.match(shell, new RegExp(route.replaceAll("/", "\\/")));

  for (const rootClass of [
    ".dashboard-content",
    ".section-page",
    ".finance-page",
    ".sales-page",
    ".einvoice-page",
    ".recon-page",
    ".core-page",
    ".guided-setup-page",
    ".controls-page",
    ".security-account-page",
    ".security-account-modern",
  ]) assert.ok(styles.includes(rootClass), `${rootClass} must be governed by the shared route lock`);

  for (const heroClass of [
    ".finance-hero",
    ".sales-hero",
    ".einvoice-hero",
    ".recon-hero",
    ".core-hero",
    ".setup-hero",
    ".controls-hero",
    ".security-account-hero",
  ]) assert.ok(styles.includes(heroClass), `${heroClass} must have readable inverse text`);

  assert.match(styles, /--biloo-route-navy: #14213d/);
  assert.match(styles, /--biloo-route-gold: #fca311/);
  assert.match(styles, /color: #ffffff !important/);
  assert.match(styles, /-webkit-text-fill-color: #ffffff !important/);
  assert.match(styles, /opacity: 1 !important/);
  assert.match(styles, /background: var\(--biloo-route-gold\) !important/);
  assert.match(styles, /background: var\(--biloo-route-navy\) !important/);

  const finalImport = 'import "./biloo-all-workspace-routes-contrast-lock.css";';
  assert.ok(layout.includes(finalImport));
  assert.ok(layout.lastIndexOf(finalImport) > layout.lastIndexOf('import "./biloo-workspace-final-lock.css";'));
});
