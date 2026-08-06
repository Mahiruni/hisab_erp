import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const remainingSlugs = [
  "purchasing-expenses",
  "inventory-warehouse",
  "customers-suppliers",
  "security-approvals-audit",
  "reports-analytics",
  "localization-compliance",
  "human-resources-payroll",
  "fixed-assets",
  "budgeting-projects",
  "integrations-automation",
];

test("all remaining ERP modules use the operational workspace", async () => {
  const [definitions, route, workspace, shell] = await Promise.all([
    read("lib/operational-modules.ts"),
    read("app/modules/[slug]/page.tsx"),
    read("components/operational-module-workspace.tsx"),
    read("components/workspace-shell.tsx"),
  ]);

  for (const slug of remainingSlugs) {
    assert.match(definitions, new RegExp(slug));
    assert.match(shell, new RegExp(slug));
  }
  assert.match(route, /getOperationalModuleSnapshot/);
  assert.match(route, /OperationalModuleWorkspace/);
  assert.match(workspace, /createOperationalRecord/);
  assert.match(workspace, /updateOperationalRecordStatus/);
});

test("remaining modules database foundation is tenant isolated and audited", async () => {
  const [schema, workflows, permissions] = await Promise.all([
    read("supabase/migrations/20260717221000_remaining_modules_operational_foundation.sql"),
    read("supabase/migrations/20260717221100_remaining_modules_operational_workflows.sql"),
    read("supabase/migrations/20260717221200_remaining_modules_restrict_direct_writes.sql"),
  ]);

  assert.match(schema, /operational_records/);
  assert.match(schema, /operational_record_events/);
  assert.match(schema, /enable row level security/i);
  assert.match(schema, /is_org_member/);
  assert.match(workflows, /create_operational_record/);
  assert.match(workflows, /update_operational_record_status/);
  assert.match(workflows, /get_operational_module_snapshot/);
  assert.match(workflows, /audit_events/);
  assert.match(workflows, /grant execute[\s\S]*authenticated/i);
  assert.match(permissions, /revoke all[\s\S]*authenticated/i);
  assert.match(permissions, /grant select[\s\S]*authenticated/i);
});

test("product experience includes transitions, confirmations, themes and branding", async () => {
  const [provider, theme, loading, language, styles, shell] = await Promise.all([
    read("components/app-experience-provider.tsx"),
    read("components/theme-toggle.tsx"),
    read("app/loading.tsx"),
    read("components/language-provider.tsx"),
    read("app/product-experience.css"),
    read("components/workspace-shell.tsx"),
  ]);

  assert.match(provider, /hisab-orbit-loader/);
  assert.match(provider, /successCode/);
  assert.match(theme, /hisab-theme/);
  assert.match(loading, /Preparing your workspace/);
  assert.match(language, /language-segmented/);
  assert.match(styles, /data-theme="dark"/);
  assert.match(shell, /Powered by/);
  assert.match(shell, /hisabtechnologies\.com/);
});
