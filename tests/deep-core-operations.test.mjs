import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("dedicated core operation routes replace generic workspaces", async () => {
  const [purchasingRoute, inventoryRoute, hrRoute, moduleRoute, shell] = await Promise.all([
    read("app/purchasing/page.tsx"),
    read("app/inventory/page.tsx"),
    read("app/hr/page.tsx"),
    read("app/modules/[slug]/page.tsx"),
    read("components/workspace-shell.tsx"),
  ]);
  assert.match(purchasingRoute, /getPurchasingSnapshot/);
  assert.match(inventoryRoute, /getInventoryOperationsSnapshot/);
  assert.match(hrRoute, /getHrPayrollSnapshot/);
  assert.match(moduleRoute, /redirect\("\/purchasing"\)/);
  assert.match(moduleRoute, /redirect\("\/inventory"\)/);
  assert.match(moduleRoute, /redirect\("\/hr"\)/);
  assert.match(shell, /href: "\/purchasing"/);
  assert.match(shell, /href: "\/inventory"/);
  assert.match(shell, /href: "\/hr"/);
});

test("purchasing UI exposes complete translated procure-to-pay workflow", async () => {
  const [workspace, actions] = await Promise.all([
    read("components/purchasing-workspace.tsx"),
    read("lib/actions/purchasing.ts"),
  ]);
  for (const key of ["c.suppliers", "c.requests", "c.quotes", "c.orders", "c.receipts", "c.bills", "c.returns"]) assert.match(workspace, new RegExp(key.replace(".", "\\.")));
  for (const action of ["createSupplierAction", "createPurchaseRequestAction", "createSupplierQuoteAction", "recordGoodsReceiptAction", "postSupplierBillAction", "recordSupplierPaymentAction", "postPurchaseReturnAction"]) assert.match(actions, new RegExp(action));
});

test("inventory UI exposes transfers counts adjustments and traceability", async () => {
  const [workspace, actions] = await Promise.all([
    read("components/inventory-operations-workspace.tsx"),
    read("lib/actions/inventory-operations.ts"),
  ]);
  for (const key of ["c.products", "c.transfers", "c.counts", "c.adjustments", "c.tracking"]) assert.match(workspace, new RegExp(key.replace(".", "\\.")));
  for (const action of ["createStockTransferAction", "completeStockTransferAction", "createStockCountAction", "submitStockCountAction", "postStockCountAction", "postInventoryAdjustmentAction", "registerInventoryTrackingAction"]) assert.match(actions, new RegExp(action));
});

test("HR UI exposes employee attendance leave salary and payroll controls", async () => {
  const [workspace, actions, copy] = await Promise.all([
    read("components/hr-payroll-workspace.tsx"),
    read("lib/actions/hr-payroll.ts"),
    read("lib/core-operations-copy.ts"),
  ]);
  for (const key of ["c.employees", "c.attendance", "c.leave", "c.payroll"]) assert.match(workspace, new RegExp(key.replace(".", "\\.")));
  for (const action of ["createEmployeeAction", "recordAttendanceAction", "createLeaveRequestAction", "setSalaryStructureAction", "createPayrollRunAction", "approvePayrollRunAction", "postPayrollRunAction", "markPayrollPaidAction"]) assert.match(actions, new RegExp(action));
  assert.match(copy, /professional review/i);
});

test("permissions include purchasing and HR without expanding staff writes", async () => {
  const context = await read("lib/data/context.ts");
  assert.match(context, /manage_purchasing/);
  assert.match(context, /manage_hr/);
  assert.match(context, /staff: \[\]/);
});

test("purchasing migrations enforce RLS and atomic AP posting", async () => {
  const [schema, receipt, bills] = await Promise.all([
    read("supabase/migrations/20260718090000_purchasing_accounts_payable_schema.sql"),
    read("supabase/migrations/20260718090300_purchasing_goods_receipt_workflow.sql"),
    read("supabase/migrations/20260718090400_purchasing_bill_payment_return_workflows.sql"),
  ]);
  assert.match(schema, /enable row level security/i);
  assert.match(schema, /security_invoker=true/i);
  assert.match(schema, /revoke all[\s\S]*authenticated/i);
  assert.match(receipt, /record_stock_movement/);
  assert.match(bills, /Accounts payable/);
  assert.match(bills, /Input VAT/);
  assert.match(bills, /post_purchase_return/);
  assert.match(bills, /grant execute[\s\S]*authenticated/i);
});

test("inventory migrations cover warehouse movement counts and traceability", async () => {
  const [schema, movement, counts] = await Promise.all([
    read("supabase/migrations/20260718091000_inventory_warehouse_operations_schema.sql"),
    read("supabase/migrations/20260718091100_inventory_transfer_adjustment_workflows.sql"),
    read("supabase/migrations/20260718091200_inventory_count_tracking_workflows.sql"),
  ]);
  assert.match(schema, /inventory_lots/);
  assert.match(schema, /inventory_serials/);
  assert.match(schema, /enable row level security/i);
  assert.match(movement, /transfer_out/);
  assert.match(movement, /transfer_in/);
  assert.match(movement, /journal_lines/);
  assert.match(counts, /post_stock_count/);
  assert.match(counts, /register_inventory_tracking/);
});

test("stock balance reads remain exposed only to authenticated users", async () => {
  const migration = await read("supabase/migrations/20260718133000_grant_stock_balances_authenticated_select.sql");
  assert.match(migration, /grant\s+select\s+on\s+table\s+public\.stock_balances\s+to\s+authenticated/i);
  assert.doesNotMatch(migration, /grant[\s\S]*(insert|update|delete)[\s\S]*stock_balances/i);
  assert.doesNotMatch(migration, /\bto\s+anon\b/i);
});

test("payroll migrations keep rates configurable and journals balanced", async () => {
  const [schema, calculation, posting, payment] = await Promise.all([
    read("supabase/migrations/20260718092000_hr_payroll_schema.sql"),
    read("supabase/migrations/20260718092200_hr_payroll_calculation_workflows.sql"),
    read("supabase/migrations/20260718092300_hr_payroll_posting_workflow.sql"),
    read("supabase/migrations/20260718092400_hr_payroll_payment_workflow.sql"),
  ]);
  assert.match(schema, /employee_pension_rate/);
  assert.match(schema, /income_tax_rate/);
  assert.match(calculation, /overtime_hourly_rate/);
  assert.match(calculation, /employee_pension_rate/);
  assert.match(calculation, /income_tax_rate/);
  assert.match(posting, /Payroll Payable/);
  assert.match(posting, /Employer Pension Expense/);
  assert.match(payment, /'draft','payroll_payment'/);
  assert.match(payment, /update public\.journal_entries set status='posted'/);
});
