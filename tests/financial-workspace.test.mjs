import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [layout, dashboard, profiles, copy, primitives, foundation, components, dashboardStyles] = await Promise.all([
  readFile("app/layout.tsx", "utf8"),
  readFile("components/dashboard.tsx", "utf8"),
  readFile("components/dashboard-role-profiles.ts", "utf8"),
  readFile("components/dashboard-interface-copy.ts", "utf8"),
  readFile("components/ui/workspace-primitives.tsx", "utf8"),
  readFile("app/financial-workspace-foundation.css", "utf8"),
  readFile("app/financial-workspace-components.css", "utf8"),
  readFile("app/financial-dashboard.css", "utf8"),
]);

test("financial workspace layers load after legacy and Supabase navigation styles", () => {
  assert.match(layout, /data-workspace-system="financial-os-v1"/);
  const supabaseIndex = layout.indexOf('import "./supabase-sidebar.css"');
  const foundationIndex = layout.indexOf('import "./financial-workspace-foundation.css"');
  const componentsIndex = layout.indexOf('import "./financial-workspace-components.css"');
  const dashboardIndex = layout.indexOf('import "./financial-dashboard.css"');
  assert.ok(supabaseIndex >= 0 && foundationIndex > supabaseIndex);
  assert.ok(componentsIndex > foundationIndex);
  assert.ok(dashboardIndex > componentsIndex);
});

test("shared primitives cover page hierarchy metrics statuses alerts and empty states", () => {
  for (const component of ["WorkspacePageHeader", "MetricTile", "StatusBadge", "ActionAlert", "EmptyState"]) {
    assert.ok(primitives.includes(`function ${component}`), `missing ${component}`);
  }
  assert.match(primitives, /aria-label="Breadcrumb"/);
  assert.match(primitives, /workspace-inline-action/);
  assert.match(primitives, /tone-success/);
});

test("dashboard answers core financial questions without inventing unavailable data", () => {
  assert.match(dashboard, /const operatingResult = metrics\.sales - metrics\.expenses/);
  for (const key of ["ui.sales", "ui.expenses", "ui.cash", "ui.receivables", "ui.operatingResult"]) {
    assert.ok(dashboard.includes(key), `missing metric ${key}`);
  }
  assert.match(dashboard, /financial-metric-grid/);
  assert.match(dashboard, /workspace-action-alert-list/);
  assert.match(dashboard, /href="\/reconciliation"/);
  assert.match(dashboard, /workspace-data-table/);
  assert.doesNotMatch(dashboard, /payables[^\n]*money\(/i);
});

test("dashboard preserves role-aware routing and bilingual interface copy", () => {
  for (const role of ["owner", "admin", "accountant", "sales", "inventory", "manager", "staff", "viewer"]) {
    assert.match(profiles, new RegExp(`\\b${role}: \\{`));
  }
  for (const route of ["/sales/invoices/new", "/finance/journals", "/inventory", "/reports", "/security", "/customers"]) {
    assert.ok(profiles.includes(route) || dashboard.includes(route), `missing ${route}`);
  }
  assert.match(copy, /Business overview/);
  assert.match(copy, /የንግድ አጠቃላይ እይታ/);
  assert.match(copy, /Bank and payment reconciliation/);
  assert.match(copy, /የባንክ እና ክፍያ ማስታረቅ/);
});

test("foundation uses calm financial surfaces and compact controls", () => {
  assert.match(foundation, /--fin-canvas:#f7f7f8/);
  assert.match(foundation, /--fin-radius-sm:6px/);
  assert.match(foundation, /--fin-radius-lg:10px/);
  assert.match(foundation, /min-height:38px/);
  assert.match(foundation, /min-height:40px/);
  assert.match(foundation, /background-image:none!important/);
  assert.match(foundation, /font-feature-settings:[^;]*"tnum" 1/);
  assert.match(foundation, /html\[data-theme="dark"\]/);
  assert.match(foundation, /prefers-reduced-motion/);
});

test("component system standardizes data-heavy ERP behavior", () => {
  assert.match(components, /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(components, /position:sticky;top:0/);
  assert.match(components, /height:44px/);
  assert.match(components, /text-align:right!important/);
  assert.match(components, /status-badge\.paid/);
  assert.match(components, /status-badge\.overdue/);
  assert.match(components, /workspace-action-alert/);
  assert.match(components, /workspace-empty-state/);
  assert.match(components, /@media\(max-width:700px\)/);
});

test("dashboard layout remains dense responsive and non-decorative", () => {
  assert.match(dashboardStyles, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(dashboardStyles, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(dashboardStyles, /financial-analysis-grid/);
  assert.match(dashboardStyles, /health-summary-bar/);
  assert.doesNotMatch(dashboardStyles, /linear-gradient|radial-gradient/);
  assert.match(dashboardStyles, /@media\(max-width:700px\)/);
});
