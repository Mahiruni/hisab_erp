import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Daraja credentials are organization-scoped and encrypted in Vault", async () => {
  const migration = await read("supabase/migrations/20260719210000_mpesa_daraja_secure_credentials.sql");
  assert.match(migration, /hisab_mpesa_consumer_key:' \|\| p_organization_id::text/);
  assert.match(migration, /hisab_mpesa_consumer_secret:' \|\| p_organization_id::text/);
  assert.match(migration, /vault\.create_secret/);
  assert.match(migration, /vault\.update_secret/);
  assert.match(migration, /perform public\.require_strong_admin\(p_organization_id\)/);
  assert.match(migration, /if v_role<>'service_role'/);
  assert.match(migration, /grant execute on function public\.get_mpesa_daraja_credentials\(uuid\) to service_role/);
  assert.doesNotMatch(migration, /grant execute on function public\.get_mpesa_daraja_credentials\(uuid\) to authenticated/);
});

test("Daraja status never returns a Consumer Secret", async () => {
  const migration = await read("supabase/migrations/20260719210000_mpesa_daraja_secure_credentials.sql");
  const statusStart = migration.indexOf("create or replace function public.get_mpesa_daraja_status");
  const credentialsStart = migration.indexOf("create or replace function public.get_mpesa_daraja_credentials");
  const statusFunction = migration.slice(statusStart, credentialsStart);
  assert.match(statusFunction, /'keySuffix'/);
  assert.match(statusFunction, /'callbackTokenPresent'/);
  assert.doesNotMatch(statusFunction, /'consumerSecret'/);
  assert.doesNotMatch(statusFunction, /'callbackToken',v_callback/);
});

test("OAuth validation is server-only and never returns the access token", async () => {
  const client = await read("lib/reconciliation/daraja.ts");
  assert.match(client, /import "server-only"/);
  assert.match(client, /sandbox\.safaricom\.co\.ke\/oauth\/v1\/generate/);
  assert.match(client, /api\.safaricom\.co\.ke\/oauth\/v1\/generate/);
  assert.match(client, /Authorization: `Basic \$\{authorization\}`/);
  assert.match(client, /AbortSignal\.timeout\(12000\)/);
  assert.match(client, /accessToken/);
  assert.doesNotMatch(client, /return \{[^}]*accessToken/s);
  assert.doesNotMatch(client, /stkpush|processrequest|transactionstatus|reversal/i);
});

test("Credential actions require an MFA-verified owner or administrator", async () => {
  const actions = await read("lib/actions/mpesa-daraja.ts");
  assert.match(actions, /\["owner", "admin"\]\.includes\(context\.role\)/);
  assert.match(actions, /context\.aal !== "aal2"/);
  assert.match(actions, /save_mpesa_daraja_credentials/);
  assert.match(actions, /record_mpesa_daraja_connection_check/);
  assert.doesNotMatch(actions, /console\.(log|error).*consumer/i);
});

test("The browser form masks credentials and never prefills encrypted values", async () => {
  const component = await read("components/mpesa-daraja-settings.tsx");
  assert.match(component, /name="consumerKey" type="password"/);
  assert.match(component, /name="consumerSecret" type="password"/);
  assert.match(component, /Encrypt and save Daraja credentials/);
  assert.match(component, /does not initiate, reverse, or query a payment/);
  assert.doesNotMatch(component, /defaultValue=\{.*consumer(Key|Secret)/);
  assert.doesNotMatch(component, /callbackToken[^P]/);
});

test("M-Pesa callbacks use a separate token and remain fail-closed", async () => {
  const callback = await read("lib/reconciliation/provider-callback.ts");
  assert.match(callback, /process\.env\.MPESA_CALLBACK_TOKEN/);
  assert.match(callback, /getMpesaCallbackCredential\(sourceReference\)/);
  assert.match(callback, /Invalid callback token/);
  assert.match(callback, /Provider callback processing is not configured/);
  assert.doesNotMatch(callback, /consumerSecret|consumerKey/);
});
