import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("reconciliation tables are tenant isolated and direct writes are revoked", async () => {
  const schema = await read("supabase/migrations/20260719080000_reconciliation_schema.sql");
  for (const table of ["reconciliation_sources", "reconciliation_import_batches", "reconciliation_transactions", "reconciliation_matches", "reconciliation_provider_events", "reconciliation_events"]) {
    assert.match(schema, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(schema, /revoke insert, update, delete, truncate[\s\S]+from anon, authenticated/i);
  assert.match(schema, /unique \(organization_id, source_id, idempotency_key\)/i);
  assert.match(schema, /unique \(organization_id, provider, provider_event_id\)/i);
});

test("provider callbacks are service-role only and cannot post journals", async () => {
  const [migration, handler, telebirr, mpesa] = await Promise.all([
    read("supabase/migrations/20260719080100_reconciliation_import_matching.sql"),
    read("lib/reconciliation/provider-callback.ts"),
    read("app/api/reconciliation/telebirr/callback/route.ts"),
    read("app/api/reconciliation/mpesa/callback/route.ts"),
  ]);
  assert.match(migration, /grant execute on function public\.ingest_provider_reconciliation_event[\s\S]+to service_role/i);
  assert.match(migration, /revoke all on function public\.ingest_provider_reconciliation_event[\s\S]+authenticated/i);
  assert.match(handler, /timingSafeEqual/);
  assert.match(handler, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(handler, /TELEBIRR_CALLBACK_TOKEN/);
  assert.match(handler, /MPESA_CALLBACK_TOKEN/);
  assert.doesNotMatch(handler, /confirm_reconciliation_match/);
  assert.match(telebirr, /handleProviderCallback\(request, "telebirr"\)/);
  assert.match(mpesa, /handleProviderCallback\(request, "safaricom_daraja"\)/);
});

test("the auth proxy permits only the exact provider callback endpoints", async () => {
  const proxy = await read("lib/supabase/proxy.ts");
  assert.match(proxy, /const publicApiRoutes = new Set\(\[/);
  assert.match(proxy, /"\/api\/health"/);
  assert.match(proxy, /"\/api\/reconciliation\/telebirr\/callback"/);
  assert.match(proxy, /"\/api\/reconciliation\/mpesa\/callback"/);
  assert.doesNotMatch(proxy, /startsWith\("\/api\/reconciliation\/"\)/);
  assert.match(proxy, /if \(!isAuthenticated && !publicPath\)/);
  assert.match(proxy, /if \(path\.startsWith\("\/api\/"\)\) return NextResponse\.json\(\{ error: "Authentication required\." \}/);
});

test("statement ingestion limits, hashes and deduplicates input", async () => {
  const [parser, migration] = await Promise.all([
    read("lib/reconciliation/statement-parser.ts"),
    read("supabase/migrations/20260719080100_reconciliation_import_matching.sql"),
  ]);
  assert.match(parser, /5 \* 1024 \* 1024/);
  assert.match(parser, /MAX_ROWS = 5000/);
  assert.match(parser, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(parser, /unclosed quoted field/);
  assert.match(migration, /This statement file was already imported/);
  assert.match(migration, /on conflict \(organization_id,source_id,idempotency_key\) do nothing/i);
});

test("posting enforces settlement equations and balanced journals", async () => {
  const posting = await read("supabase/migrations/20260719080200_reconciliation_posting.sql");
  assert.match(posting, /Incoming allocation must equal cash plus fee and withholding/);
  assert.match(posting, /Outgoing cash must equal allocation plus fee less withholding/);
  assert.match(posting, /Reconciliation journal is not balanced/);
  assert.match(posting, /Accounts receivable control account is missing/);
  assert.match(posting, /Accounts payable control account is missing/);
  assert.match(posting, /status='posted',posted_by=p_actor_id,posted_at=now\(\)/);
  assert.match(posting, /reconciliation\.match\.confirmed/);
});

test("confirmed matches reverse through a separate journal", async () => {
  const posting = await read("supabase/migrations/20260719080200_reconciliation_posting.sql");
  assert.match(posting, /create or replace function public\.reverse_reconciliation_match/i);
  assert.match(posting, /'reconciliation_reversal'/);
  assert.match(posting, /select p_organization_id,v_rev,account_id,'Reversal: '/);
  assert.match(posting, /reversal_journal_entry_id=v_rev/);
  assert.match(posting, /reconciliation\.match\.reversed/);
});

test("workspace exposes the complete reconciliation workflow", async () => {
  const [page, workspace, shell, layout] = await Promise.all([
    read("app/reconciliation/page.tsx"),
    read("components/reconciliation-workspace.tsx"),
    read("components/workspace-shell.tsx"),
    read("app/layout.tsx"),
  ]);
  assert.match(page, /getReconciliationSnapshot/);
  assert.match(workspace, /Bank, Telebirr and M-Pesa Reconciliation/);
  assert.match(workspace, /Import and suggest matches/);
  assert.match(workspace, /Confirm match and post journal/);
  assert.match(workspace, /Post reversal journal/);
  assert.match(workspace, /Safaricom M-Pesa callback/);
  assert.match(shell, /href: "\/reconciliation"/);
  assert.match(layout, /import "\.\/reconciliation\.css"/);
});

test("browser forms never request provider secrets or the Supabase service key", async () => {
  const workspace = await read("components/reconciliation-workspace.tsx");
  assert.doesNotMatch(workspace, /name="(?:token|secret|serviceRoleKey|apiKey|consumerSecret)"/i);
  assert.doesNotMatch(workspace, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(workspace, /\{secret\}/);
});
