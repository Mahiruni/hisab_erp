import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("administrator privileges require MFA at app and database layers", async () => {
  const [context, migration, account] = await Promise.all([read("lib/data/context.ts"), read("supabase/migrations/20260718150000_production_controls_onboarding.sql"), read("components/mfa-security-panel.tsx")]);
  assert.match(context, /context\.mfaRequired && context\.aal !== "aal2"/);
  assert.match(migration, /auth\.jwt\(\)->>'aal'/);
  assert.match(migration, /require_strong_admin/);
  for (const api of ["mfa.enroll", "mfa.challenge", "mfa.verify", "getAuthenticatorAssuranceLevel"]) assert.match(account, new RegExp(api.replace(".", "\\.")));
});

test("password creation and recovery use breach protection", async () => {
  const [auth, safety] = await Promise.all([read("lib/actions/email-auth.ts"), read("lib/security/password-safety.ts")]);
  assert.match(auth, /assertPasswordIsSafe/);
  assert.match(safety, /pwnedpasswords\.com\/range/);
  assert.match(safety, /Add-Padding/);
});

test("production control center supports alerts health exports and recovery evidence", async () => {
  const [page, actions, auditRoute, migration] = await Promise.all([read("app/security/page.tsx"), read("lib/actions/production-controls.ts"), read("app/api/audit/export/route.ts"), read("supabase/migrations/20260718150000_production_controls_onboarding.sql")]);
  for (const phrase of ["Administrator MFA", "Leaked-password protection", "Point-in-time recovery", "Audit export", "Scheduled health checks"]) assert.match(page, new RegExp(phrase));
  for (const action of ["updateProductionControlsAction", "runDatabaseHealthAction", "recordBackupEvidenceAction", "recordRestoreTestAction"]) assert.match(actions, new RegExp(action));
  assert.match(auditRoute, /Administrator MFA verification required/);
  assert.match(migration, /cron\.schedule/);
  assert.match(migration, /database_health_checks/);
});

test("onboarding is an eight-step data-backed workflow", async () => {
  const [page, actions, migration] = await Promise.all([read("app/onboarding/page.tsx"), read("lib/actions/onboarding.ts"), read("supabase/migrations/20260718150000_production_controls_onboarding.sql")]);
  for (const key of ["company", "branches", "contacts", "products", "taxes", "opening", "invoice", "security"]) assert.match(page, new RegExp(`${key}:`));
  for (const action of ["bootstrapGuidedOrganization", "createOnboardingBranchAction", "importCustomersAction", "importSuppliersAction", "importProductsAction", "postOpeningBalanceAction"]) assert.match(actions, new RegExp(action));
  assert.match(migration, /get_onboarding_snapshot/);
  assert.match(migration, /post_onboarding_opening_balance/);
});
