export type SelectOption = { id: string; label: string };

export type PurchasingSnapshot = {
  mode: "demo" | "live";
  organizationName: string;
  suppliers: Array<{ id: string; name: string; phone: string | null; tin: string | null; paymentTermsDays: number; creditLimit: number; balance: number }>;
  requests: Array<{ id: string; number: string; date: string; neededBy: string | null; department: string | null; requester: string | null; status: string; notes: string | null; items: Array<{ id: string; productId: string | null; warehouseId: string | null; description: string; quantity: number; estimatedUnitCost: number }> }>;
  quotes: Array<{ id: string; number: string; supplierId: string; supplierName: string; requestId: string | null; reference: string | null; date: string; validUntil: string | null; status: string; subtotal: number; tax: number; total: number; items: Array<{ id: string; productId: string | null; warehouseId: string | null; description: string; quantity: number; unitCost: number; taxRate: number }> }>;
  orders: Array<{ id: string; number: string; supplierId: string; supplierName: string; date: string; expectedDate: string | null; status: string; subtotal: number; tax: number; total: number; items: Array<{ id: string; productId: string | null; warehouseId: string | null; description: string; quantity: number; receivedQuantity: number; billedQuantity: number; returnedQuantity: number; unitCost: number; taxRate: number }> }>;
  receipts: Array<{ id: string; number: string; orderId: string; date: string; reference: string | null; status: string }>;
  bills: Array<{ id: string; number: string; supplierId: string; supplierName: string; orderId: string | null; receiptId: string | null; supplierInvoiceNumber: string | null; date: string; dueDate: string; status: string; subtotal: number; tax: number; total: number; paid: number; credited: number; outstanding: number }>;
  returns: Array<{ id: string; number: string; supplierName: string; date: string; status: string; total: number; reason: string | null }>;
  products: Array<{ id: string; name: string; sku: string; costPrice: number }>;
  warehouses: SelectOption[];
  expenseAccounts: SelectOption[];
};

export type InventoryOperationsSnapshot = {
  mode: "demo" | "live";
  organizationName: string;
  products: Array<{ id: string; sku: string; name: string; costPrice: number; reorderLevel: number; totalQuantity: number; needsReorder: boolean; balances: Array<{ warehouseId: string; warehouseName: string; quantity: number }> }>;
  warehouses: SelectOption[];
  transfers: Array<{ id: string; number: string; sourceWarehouseId: string; sourceWarehouse: string; destinationWarehouseId: string; destinationWarehouse: string; date: string; status: string; notes: string | null; items: Array<{ id: string; productId: string; productName: string; quantity: number }> }>;
  counts: Array<{ id: string; number: string; warehouseId: string; warehouseName: string; date: string; status: string; notes: string | null; items: Array<{ id: string; productId: string; productName: string; systemQuantity: number; countedQuantity: number | null; variance: number }> }>;
  adjustments: Array<{ id: string; number: string; warehouseName: string; productName: string; date: string; type: string; quantity: number; value: number; reason: string }>;
  lots: Array<{ id: string; productName: string; warehouseName: string; lotNumber: string; manufactureDate: string | null; expiryDate: string | null; quantity: number; status: string }>;
  serials: Array<{ id: string; productName: string; warehouseName: string | null; serialNumber: string; status: string }>;
};

export type HrPayrollSnapshot = {
  mode: "demo" | "live";
  organizationName: string;
  employees: Array<{ id: string; number: string; fullName: string; email: string | null; phone: string | null; department: string | null; position: string | null; employmentType: string; hireDate: string; status: string; baseSalary: number | null; allowances: number | null; employeePensionRate: number | null; employerPensionRate: number | null; incomeTaxRate: number | null }>;
  attendance: Array<{ id: string; employeeId: string; employeeName: string; date: string; status: string; regularHours: number; overtimeHours: number }>;
  leaves: Array<{ id: string; number: string; employeeId: string; employeeName: string; type: string; startDate: string; endDate: string; days: number; status: string; reason: string | null }>;
  payrollRuns: Array<{ id: string; number: string; periodStart: string; periodEnd: string; payDate: string; status: string; grossPay: number; employeePension: number; employerPension: number; incomeTax: number; otherDeductions: number; netPay: number; items: Array<{ id: string; employeeId: string; employeeName: string; grossPay: number; employeePension: number; employerPension: number; incomeTax: number; otherDeductions: number; netPay: number; attendanceDays: number; leaveDays: number }> }>;
  cashAccounts: SelectOption[];
};