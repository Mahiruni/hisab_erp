import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(file, "utf8");

test("the footer uses the requested HisabTech company link", async () => {
  const shell = await read("components/workspace-shell.tsx");
  assert.match(shell, /Powered by\s*<a href="https:\/\/www\.hisabtechnologies\.com"/);
  assert.match(shell, />HisabTech<\/a>/);
});

test("Hisab branding is enlarged consistently", async () => {
  const styles = await read("app/brand-refinements.css");
  assert.match(styles, /\.erp-shell \.brand>span\{width:52px;height:52px/);
  assert.match(styles, /\.erp-shell \.brand strong\{font-size:24px/);
  assert.match(styles, /\.launch-brand>span\{width:42px;height:42px/);
});

test("product readiness exposes steps seven through ten", async () => {
  const roadmap = await read("components/readiness-roadmap.tsx");
  for (const number of ["07", "08", "09", "10"]) assert.match(roadmap, new RegExp(`number: "${number}"`));
  assert.match(roadmap, /Standardize the design system/);
  assert.match(roadmap, /Review translations professionally/);
  assert.match(roadmap, /Add role-based dashboards/);
  assert.match(roadmap, /Obtain Ethiopian compliance review/);
  assert.match(roadmap, /It is not a legal certification/);
});

test("all supported roles receive a dashboard profile", async () => {
  const dashboard = await read("components/dashboard.tsx");
  for (const role of ["owner", "admin", "accountant", "sales", "inventory", "manager", "staff", "viewer"]) {
    assert.match(dashboard, new RegExp(`\\n  ${role}: \\{`));
  }
  assert.match(dashboard, /data-dashboard-role=\{user\.role\}/);
});

test("the standardized design system is active at the root", async () => {
  const [layout, designSystem] = await Promise.all([read("app/layout.tsx"), read("app/design-system.css")]);
  assert.match(layout, /import "\.\/design-system\.css"/);
  assert.match(layout, /data-design-system="hisab-v1"/);
  for (const token of ["--ds-color-brand-950", "--ds-color-surface-panel", "--ds-space-4", "--ds-radius-lg", "--ds-focus"]) {
    assert.ok(designSystem.includes(token), `missing design token ${token}`);
  }
});
