import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared section pages use the standardized hierarchy", async () => {
  const shell = await read("components/section-shell.tsx");
  assert.match(shell, /section-page section-page-modern/);
  assert.match(shell, /section-breadcrumb/);
  assert.match(shell, /section-shell-hero/);
  assert.match(shell, /section-shell-content/);
  assert.match(shell, /LanguageSelector/);
  assert.match(shell, /aria-current="page"/);
});

test("customers and reports expose useful modern summaries without changing actions", async () => {
  const [customers, reports] = await Promise.all([
    read("app/customers/page.tsx"),
    read("app/reports/page.tsx"),
  ]);

  assert.match(customers, /section-kpis/);
  assert.match(customers, /customer-record-card/);
  assert.match(customers, /action=\{createCustomer\}/);
  assert.match(customers, /disabled=\{mode === "demo"\}/);

  assert.match(reports, /report-insight-grid/);
  assert.match(reports, /operatingResult/);
  assert.match(reports, /href="\/api\/reports\/dashboard"/);
});

test("module catalog and all major workspaces share the final design layer", async () => {
  const [catalog, layout, css] = await Promise.all([
    read("components/module-catalog.tsx"),
    read("app/layout.tsx"),
    read("app/workspace-standardization.css"),
  ]);

  assert.match(catalog, /module-summary-strip/);
  assert.match(catalog, /module-card-copy/);
  assert.ok(
    layout.indexOf('./workspace-standardization.css') > layout.indexOf('./account-security-premium.css'),
    "workspace standardization must load after the account security layer",
  );

  for (const selector of [
    ".section-page",
    ".core-page",
    ".finance-page",
    ".sales-page",
    ".controls-page",
    ".module-page",
    ".einvoice-page",
    ".recon-page",
  ]) {
    assert.match(css, new RegExp(selector.replace(".", "\\.")));
  }

  assert.match(css, /html\[data-theme="dark"\]/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media\(max-width:760px\)/);
});
