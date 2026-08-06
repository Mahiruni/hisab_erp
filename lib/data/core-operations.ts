import { isSupabaseConfigured } from "../config";
import { createClient } from "../supabase/server";
import { getCurrentUserContext } from "./context";
import type { HrPayrollSnapshot, InventoryOperationsSnapshot, PurchasingSnapshot } from "./core-operations-types";

type Row = Record<string, unknown>;
const list = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : [];
const text = (value: unknown) => typeof value === "string" ? value : "";
const nullableText = (value: unknown) => typeof value === "string" && value.length ? value : null;
const numberValue = (value: unknown) => Number(value || 0);

function emptyPurchasing(organizationName = "Hisab Demo") : PurchasingSnapshot {
  return { mode: "demo", organizationName, suppliers: [], requests: [], quotes: [], orders: [], receipts: [], bills: [], returns: [], products: [], warehouses: [], expenseAccounts: [] };
}
function emptyInventory(organizationName = "Hisab Demo") : InventoryOperationsSnapshot {
  return { mode: "demo", organizationName, products: [], warehouses: [], transfers: [], counts: [], adjustments: [], lots: [], serials: [] };
}
function emptyHr(organizationName = "Hisab Demo") : HrPayrollSnapshot {
  return { mode: "demo", organizationName, employees: [], attendance: [], leaves: [], payrollRuns: [], cashAccounts: [] };
}

export async function getPurchasingSnapshot(): Promise<PurchasingSnapshot> {
  if (!isSupabaseConfigured()) return emptyPurchasing();
  const context = await getCurrentUserContext({ required: true });
  if (!context) return emptyPurchasing();
  const supabase = await createClient();
  const org = context.organizationId;
  const [suppliersQ, balancesQ, requestsQ, requestItemsQ, quotesQ, quoteItemsQ, ordersQ, orderItemsQ, receiptsQ, billsQ, returnsQ, productsQ, warehousesQ, accountsQ] = await Promise.all([
    supabase.from("suppliers").select("*").eq("organization_id", org).order("name").limit(500),
    supabase.from("supplier_balance_view").select("*").eq("organization_id", org),
    supabase.from("purchase_requests").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(200),
    supabase.from("purchase_request_items").select("*").eq("organization_id", org).limit(2000),
    supabase.from("supplier_quotes").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(200),
    supabase.from("supplier_quote_items").select("*").eq("organization_id", org).limit(2000),
    supabase.from("purchase_orders").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(200),
    supabase.from("purchase_order_items").select("*").eq("organization_id", org).limit(2000),
    supabase.from("goods_receipts").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(200),
    supabase.from("supplier_bills").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(200),
    supabase.from("purchase_returns").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(200),
    supabase.from("products").select("id,sku,name,cost_price").eq("organization_id", org).eq("is_active", true).order("name").limit(1000),
    supabase.from("warehouses").select("id,name").eq("organization_id", org).eq("is_active", true).order("name"),
    supabase.from("accounts").select("id,code,name").eq("organization_id", org).eq("is_active", true).eq("account_type", "expense").order("code"),
  ]);
  const firstError = [suppliersQ, balancesQ, requestsQ, requestItemsQ, quotesQ, quoteItemsQ, ordersQ, orderItemsQ, receiptsQ, billsQ, returnsQ, productsQ, warehousesQ, accountsQ].find((result) => result.error)?.error;
  if (firstError) throw new Error(firstError.message);

  const supplierRows = list(suppliersQ.data); const balanceRows = list(balancesQ.data);
  const productRows = list(productsQ.data); const warehouseRows = list(warehousesQ.data);
  const supplierName = new Map(supplierRows.map((row) => [text(row.id), text(row.name)]));
  const balanceBySupplier = new Map(balanceRows.map((row) => [text(row.id), numberValue(row.balance)]));
  const requestItems = list(requestItemsQ.data); const quoteItems = list(quoteItemsQ.data); const orderItems = list(orderItemsQ.data);

  return {
    mode: "live",
    organizationName: context.organizationName,
    suppliers: supplierRows.map((row) => ({ id: text(row.id), name: text(row.name), phone: nullableText(row.phone), tin: nullableText(row.tin), paymentTermsDays: numberValue(row.payment_terms_days), creditLimit: numberValue(row.credit_limit), balance: balanceBySupplier.get(text(row.id)) || 0 })),
    requests: list(requestsQ.data).map((row) => ({ id: text(row.id), number: text(row.request_number), date: text(row.request_date), neededBy: nullableText(row.needed_by), department: nullableText(row.department), requester: nullableText(row.requested_by_name), status: text(row.status), notes: nullableText(row.notes), items: requestItems.filter((item) => text(item.purchase_request_id) === text(row.id)).map((item) => ({ id: text(item.id), productId: nullableText(item.product_id), warehouseId: nullableText(item.warehouse_id), description: text(item.description), quantity: numberValue(item.quantity), estimatedUnitCost: numberValue(item.estimated_unit_cost) })) })),
    quotes: list(quotesQ.data).map((row) => ({ id: text(row.id), number: text(row.quote_number), supplierId: text(row.supplier_id), supplierName: supplierName.get(text(row.supplier_id)) || "Supplier", requestId: nullableText(row.purchase_request_id), reference: nullableText(row.supplier_reference), date: text(row.quote_date), validUntil: nullableText(row.valid_until), status: text(row.status), subtotal: numberValue(row.subtotal), tax: numberValue(row.tax_amount), total: numberValue(row.total), items: quoteItems.filter((item) => text(item.supplier_quote_id) === text(row.id)).map((item) => ({ id: text(item.id), productId: nullableText(item.product_id), warehouseId: nullableText(item.warehouse_id), description: text(item.description), quantity: numberValue(item.quantity), unitCost: numberValue(item.unit_cost), taxRate: numberValue(item.tax_rate) })) })),
    orders: list(ordersQ.data).map((row) => ({ id: text(row.id), number: text(row.order_number), supplierId: text(row.supplier_id), supplierName: supplierName.get(text(row.supplier_id)) || "Supplier", date: text(row.order_date), expectedDate: nullableText(row.expected_date), status: text(row.status), subtotal: numberValue(row.subtotal), tax: numberValue(row.tax_amount), total: numberValue(row.total), items: orderItems.filter((item) => text(item.purchase_order_id) === text(row.id)).map((item) => ({ id: text(item.id), productId: nullableText(item.product_id), warehouseId: nullableText(item.warehouse_id), description: text(item.description), quantity: numberValue(item.quantity), receivedQuantity: numberValue(item.received_quantity), billedQuantity: numberValue(item.billed_quantity), returnedQuantity: numberValue(item.returned_quantity), unitCost: numberValue(item.unit_cost), taxRate: numberValue(item.tax_rate) })) })),
    receipts: list(receiptsQ.data).map((row) => ({ id: text(row.id), number: text(row.receipt_number), orderId: text(row.purchase_order_id), date: text(row.receipt_date), reference: nullableText(row.supplier_delivery_reference), status: text(row.status) })),
    bills: list(billsQ.data).map((row) => ({ id: text(row.id), number: text(row.bill_number), supplierId: text(row.supplier_id), supplierName: supplierName.get(text(row.supplier_id)) || "Supplier", orderId: nullableText(row.purchase_order_id), receiptId: nullableText(row.goods_receipt_id), supplierInvoiceNumber: nullableText(row.supplier_invoice_number), date: text(row.bill_date), dueDate: text(row.due_date), status: text(row.status), subtotal: numberValue(row.subtotal), tax: numberValue(row.tax_amount), total: numberValue(row.total), paid: numberValue(row.paid_amount), credited: numberValue(row.credited_amount), outstanding: Math.max(numberValue(row.total) - numberValue(row.paid_amount) - numberValue(row.credited_amount), 0) })),
    returns: list(returnsQ.data).map((row) => ({ id: text(row.id), number: text(row.return_number), supplierName: supplierName.get(text(row.supplier_id)) || "Supplier", date: text(row.return_date), status: text(row.status), total: numberValue(row.total), reason: nullableText(row.reason) })),
    products: productRows.map((row) => ({ id: text(row.id), name: text(row.name), sku: text(row.sku), costPrice: numberValue(row.cost_price) })),
    warehouses: warehouseRows.map((row) => ({ id: text(row.id), label: text(row.name) })),
    expenseAccounts: list(accountsQ.data).map((row) => ({ id: text(row.id), label: `${text(row.code)} · ${text(row.name)}` })),
  };
}

export async function getInventoryOperationsSnapshot(): Promise<InventoryOperationsSnapshot> {
  if (!isSupabaseConfigured()) return emptyInventory();
  const context = await getCurrentUserContext({ required: true });
  if (!context) return emptyInventory();
  const supabase = await createClient(); const org = context.organizationId;
  const [productsQ, balancesQ, warehousesQ, transfersQ, transferItemsQ, countsQ, countItemsQ, adjustmentsQ, lotsQ, serialsQ] = await Promise.all([
    supabase.from("products").select("*").eq("organization_id", org).eq("is_active", true).order("name").limit(1000),
    supabase.from("stock_balances").select("*").eq("organization_id", org).limit(5000),
    supabase.from("warehouses").select("id,name").eq("organization_id", org).eq("is_active", true).order("name"),
    supabase.from("stock_transfers").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(200),
    supabase.from("stock_transfer_items").select("*").eq("organization_id", org).limit(2000),
    supabase.from("stock_counts").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(100),
    supabase.from("stock_count_items").select("*").eq("organization_id", org).limit(5000),
    supabase.from("inventory_adjustments").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(300),
    supabase.from("inventory_lots").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(500),
    supabase.from("inventory_serials").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(1000),
  ]);
  const firstError = [productsQ, balancesQ, warehousesQ, transfersQ, transferItemsQ, countsQ, countItemsQ, adjustmentsQ, lotsQ, serialsQ].find((result) => result.error)?.error;
  if (firstError) throw new Error(firstError.message);
  const productRows = list(productsQ.data); const balanceRows = list(balancesQ.data); const warehouseRows = list(warehousesQ.data);
  const productName = new Map(productRows.map((row) => [text(row.id), text(row.name)])); const warehouseName = new Map(warehouseRows.map((row) => [text(row.id), text(row.name)]));
  const transferItems = list(transferItemsQ.data); const countItems = list(countItemsQ.data);
  return {
    mode: "live", organizationName: context.organizationName,
    products: productRows.map((row) => { const balances = balanceRows.filter((balance) => text(balance.product_id) === text(row.id)).map((balance) => ({ warehouseId: text(balance.warehouse_id), warehouseName: warehouseName.get(text(balance.warehouse_id)) || "Warehouse", quantity: numberValue(balance.quantity) })); const totalQuantity = balances.reduce((sum, balance) => sum + balance.quantity, 0); return { id: text(row.id), sku: text(row.sku), name: text(row.name), costPrice: numberValue(row.cost_price), reorderLevel: numberValue(row.reorder_level), totalQuantity, needsReorder: totalQuantity <= numberValue(row.reorder_level), balances }; }),
    warehouses: warehouseRows.map((row) => ({ id: text(row.id), label: text(row.name) })),
    transfers: list(transfersQ.data).map((row) => ({ id: text(row.id), number: text(row.transfer_number), sourceWarehouseId: text(row.source_warehouse_id), sourceWarehouse: warehouseName.get(text(row.source_warehouse_id)) || "Warehouse", destinationWarehouseId: text(row.destination_warehouse_id), destinationWarehouse: warehouseName.get(text(row.destination_warehouse_id)) || "Warehouse", date: text(row.transfer_date), status: text(row.status), notes: nullableText(row.notes), items: transferItems.filter((item) => text(item.stock_transfer_id) === text(row.id)).map((item) => ({ id: text(item.id), productId: text(item.product_id), productName: productName.get(text(item.product_id)) || "Product", quantity: numberValue(item.quantity) })) })),
    counts: list(countsQ.data).map((row) => ({ id: text(row.id), number: text(row.count_number), warehouseId: text(row.warehouse_id), warehouseName: warehouseName.get(text(row.warehouse_id)) || "Warehouse", date: text(row.count_date), status: text(row.status), notes: nullableText(row.notes), items: countItems.filter((item) => text(item.stock_count_id) === text(row.id)).map((item) => ({ id: text(item.id), productId: text(item.product_id), productName: productName.get(text(item.product_id)) || "Product", systemQuantity: numberValue(item.system_quantity), countedQuantity: item.counted_quantity === null ? null : numberValue(item.counted_quantity), variance: numberValue(item.variance_quantity) })) })),
    adjustments: list(adjustmentsQ.data).map((row) => ({ id: text(row.id), number: text(row.adjustment_number), warehouseName: warehouseName.get(text(row.warehouse_id)) || "Warehouse", productName: productName.get(text(row.product_id)) || "Product", date: text(row.adjustment_date), type: text(row.adjustment_type), quantity: numberValue(row.quantity), value: numberValue(row.quantity) * numberValue(row.unit_cost), reason: text(row.reason) })),
    lots: list(lotsQ.data).map((row) => ({ id: text(row.id), productName: productName.get(text(row.product_id)) || "Product", warehouseName: warehouseName.get(text(row.warehouse_id)) || "Warehouse", lotNumber: text(row.lot_number), manufactureDate: nullableText(row.manufacture_date), expiryDate: nullableText(row.expiry_date), quantity: numberValue(row.quantity), status: text(row.status) })),
    serials: list(serialsQ.data).map((row) => ({ id: text(row.id), productName: productName.get(text(row.product_id)) || "Product", warehouseName: warehouseName.get(text(row.warehouse_id)) || null, serialNumber: text(row.serial_number), status: text(row.status) })),
  };
}

export async function getHrPayrollSnapshot(): Promise<HrPayrollSnapshot> {
  if (!isSupabaseConfigured()) return emptyHr();
  const context = await getCurrentUserContext({ required: true });
  if (!context) return emptyHr();
  const supabase = await createClient(); const org = context.organizationId;
  const [employeesQ, salariesQ, attendanceQ, leavesQ, payrollQ, payrollItemsQ, accountsQ] = await Promise.all([
    supabase.from("employees").select("*").eq("organization_id", org).order("employee_number").limit(1000),
    supabase.from("salary_structures").select("*").eq("organization_id", org).eq("is_active", true).order("effective_from", { ascending: false }).limit(2000),
    supabase.from("attendance_entries").select("*").eq("organization_id", org).order("attendance_date", { ascending: false }).limit(500),
    supabase.from("leave_requests").select("*").eq("organization_id", org).order("created_at", { ascending: false }).limit(300),
    supabase.from("payroll_runs").select("*").eq("organization_id", org).order("period_end", { ascending: false }).limit(100),
    supabase.from("payroll_items").select("*").eq("organization_id", org).limit(5000),
    supabase.from("accounts").select("id,code,name").eq("organization_id", org).eq("is_active", true).in("account_subtype", ["cash", "bank"]).order("code"),
  ]);
  const firstError = [employeesQ, salariesQ, attendanceQ, leavesQ, payrollQ, payrollItemsQ, accountsQ].find((result) => result.error)?.error;
  if (firstError) throw new Error(firstError.message);
  const employeeRows = list(employeesQ.data); const salaryRows = list(salariesQ.data); const payrollItems = list(payrollItemsQ.data);
  const employeeName = new Map(employeeRows.map((row) => [text(row.id), `${text(row.first_name)} ${text(row.last_name)}`.trim()]));
  const currentSalary = new Map<string, Row>(); salaryRows.forEach((row) => { if (!currentSalary.has(text(row.employee_id))) currentSalary.set(text(row.employee_id), row); });
  return {
    mode: "live", organizationName: context.organizationName,
    employees: employeeRows.map((row) => { const salary = currentSalary.get(text(row.id)); return { id: text(row.id), number: text(row.employee_number), fullName: employeeName.get(text(row.id)) || "Employee", email: nullableText(row.email), phone: nullableText(row.phone), department: nullableText(row.department), position: nullableText(row.position_title), employmentType: text(row.employment_type), hireDate: text(row.hire_date), status: text(row.status), baseSalary: salary ? numberValue(salary.base_salary) : null, allowances: salary ? numberValue(salary.recurring_allowances) : null, employeePensionRate: salary ? numberValue(salary.employee_pension_rate) : null, employerPensionRate: salary ? numberValue(salary.employer_pension_rate) : null, incomeTaxRate: salary ? numberValue(salary.income_tax_rate) : null }; }),
    attendance: list(attendanceQ.data).map((row) => ({ id: text(row.id), employeeId: text(row.employee_id), employeeName: employeeName.get(text(row.employee_id)) || "Employee", date: text(row.attendance_date), status: text(row.status), regularHours: numberValue(row.regular_hours), overtimeHours: numberValue(row.overtime_hours) })),
    leaves: list(leavesQ.data).map((row) => ({ id: text(row.id), number: text(row.leave_number), employeeId: text(row.employee_id), employeeName: employeeName.get(text(row.employee_id)) || "Employee", type: text(row.leave_type), startDate: text(row.start_date), endDate: text(row.end_date), days: numberValue(row.days), status: text(row.status), reason: nullableText(row.reason) })),
    payrollRuns: list(payrollQ.data).map((row) => ({ id: text(row.id), number: text(row.payroll_number), periodStart: text(row.period_start), periodEnd: text(row.period_end), payDate: text(row.pay_date), status: text(row.status), grossPay: numberValue(row.gross_pay), employeePension: numberValue(row.employee_pension), employerPension: numberValue(row.employer_pension), incomeTax: numberValue(row.income_tax), otherDeductions: numberValue(row.other_deductions), netPay: numberValue(row.net_pay), items: payrollItems.filter((item) => text(item.payroll_run_id) === text(row.id)).map((item) => ({ id: text(item.id), employeeId: text(item.employee_id), employeeName: employeeName.get(text(item.employee_id)) || "Employee", grossPay: numberValue(item.gross_pay), employeePension: numberValue(item.employee_pension), employerPension: numberValue(item.employer_pension), incomeTax: numberValue(item.income_tax), otherDeductions: numberValue(item.other_deductions), netPay: numberValue(item.net_pay), attendanceDays: numberValue(item.attendance_days), leaveDays: numberValue(item.leave_days) })) })),
    cashAccounts: list(accountsQ.data).map((row) => ({ id: text(row.id), label: `${text(row.code)} · ${text(row.name)}` })),
  };
}