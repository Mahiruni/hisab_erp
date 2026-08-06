import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Sales workspace exposes the complete quote-to-cash route", async () => {
  const [page, workspace, shell, legacyRoute] = await Promise.all([
    read("app/sales/page.tsx"),
    read("components/sales-workspace.tsx"),
    read("components/workspace-shell.tsx"),
    read("app/sales/invoices/new/page.tsx"),
  ]);

  assert.match(page, /getSalesSnapshot/);
  assert.match(workspace, /Quotations/);
  assert.match(workspace, /Sales orders/);
  assert.match(workspace, /Invoices/);
  assert.match(workspace, /Receipts/);
  assert.match(workspace, /Returns/);
  assert.match(workspace, /Customer balances/);
  assert.match(shell, /href: "\/sales"/);
  assert.match(legacyRoute, /redirect\("\/sales\?tab=invoices"\)/);
});

test("Sales migrations include RLS, atomic posting and customer balances", async () => {
  const [schema, quotes, invoices, returns, snapshot] = await Promise.all([
    read("supabase/migrations/20260717210000_sales_invoicing_phase_one_schema.sql"),
    read("supabase/migrations/20260717210100_sales_quotation_order_workflows.sql"),
    read("supabase/migrations/20260717210200_sales_invoice_receipt_workflows.sql"),
    read("supabase/migrations/20260717210300_sales_return_workflow.sql"),
    read("supabase/migrations/20260717210400_sales_workspace_snapshot.sql"),
  ]);

  assert.match(schema, /enable row level security/i);
  assert.match(schema, /customer_sales_balance_view/);
  assert.match(quotes, /create_sales_quotation/);
  assert.match(quotes, /convert_sales_quotation_to_order/);
  assert.match(invoices, /post_sales_invoice_v2/);
  assert.match(invoices, /record_sales_receipt/);
  assert.match(returns, /post_sales_return/);
  assert.match(snapshot, /get_sales_snapshot/);
  assert.match(snapshot, /grant execute[\s\S]*authenticated/i);
});
