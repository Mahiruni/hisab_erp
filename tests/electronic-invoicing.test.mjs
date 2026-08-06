import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(file, "utf8");

test("electronic invoicing is available as a protected ERP route", async () => {
  const [page, shell, layout] = await Promise.all([
    read("app/e-invoicing/page.tsx"),
    read("components/workspace-shell.tsx"),
    read("app/layout.tsx"),
  ]);
  assert.match(page, /getCurrentUserContext\(\{ required: true \}\)/);
  assert.match(page, /getEInvoiceSnapshot\(\)/);
  assert.match(shell, /href: "\/e-invoicing"/);
  assert.match(layout, /import "\.\/e-invoicing\.css"/);
});

test("electronic invoicing uses controlled RPC workflows", async () => {
  const actions = await read("lib/actions/e-invoicing.ts");
  for (const rpc of [
    "upsert_e_invoice_profile",
    "queue_e_invoice_document",
    "record_e_invoice_clearance",
    "record_e_invoice_rejection",
    "request_e_invoice_cancellation",
    "record_e_invoice_cancellation",
  ]) assert.ok(actions.includes(`\"${rpc}\"`), `missing RPC ${rpc}`);
  assert.match(actions, /can\(context, "manage_users"\)/);
  assert.match(actions, /can\(context, "manage_sales"\)/);
  assert.match(actions, /can\(context, "manage_finance"\)/);
});

test("database migration preserves payload evidence and tenant isolation", async () => {
  const migration = await read("supabase/migrations/20260719070000_electronic_invoicing_foundation.sql");
  assert.match(migration, /payload_snapshot jsonb not null/);
  assert.match(migration, /payload_hash text/);
  assert.match(migration, /digest\(v_payload::text,'sha256'\)/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /is_org_member\(organization_id\)/);
  assert.match(migration, /revoke insert, update, delete/);
  assert.match(migration, /sales_invoice_create_e_invoice_document/);
});

test("provider credentials are not collected in the browser", async () => {
  const workspace = await read("components/e-invoicing-workspace.tsx");
  assert.doesNotMatch(workspace, /name="(?:apiKey|apiSecret|privateKey|clientSecret)"/i);
  assert.match(workspace, /Secret keys and certificate files never belong in this form/);
  assert.match(workspace, /Provider-neutral foundation/);
});
