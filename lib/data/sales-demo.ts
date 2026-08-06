import type { SalesSnapshot } from "./sales-types";

const today = new Date();
const iso = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return iso(date);
};

export const demoSales: SalesSnapshot = {
  mode: "demo",
  organizationName: "Hisab Trading Enterprise",
  metrics: {
    activeQuotations: 4,
    openOrders: 3,
    invoicedThisMonth: 126_850,
    receivedThisMonth: 72_500,
    returnsThisMonth: 3_450,
    outstanding: 54_350,
  },
  quotations: [
    { id: "quo-1", number: "QUO-2026-000021", date: iso(today), validUntil: addDays(10), status: "sent", customerId: "customer-1", customerName: "Selam Trading PLC", subtotal: 32_000, discount: 1_600, tax: 4_560, total: 34_960, notes: "Wholesale price valid for ten days." },
    { id: "quo-2", number: "QUO-2026-000020", date: addDays(-2), validUntil: addDays(5), status: "accepted", customerId: "customer-2", customerName: "Bekele Retail Store", subtotal: 18_000, discount: 0, tax: 2_700, total: 20_700, notes: null },
  ],
  orders: [
    { id: "order-1", number: "SO-2026-000014", date: addDays(-1), expectedDate: addDays(2), status: "confirmed", customerId: "customer-2", customerName: "Bekele Retail Store", quotationId: "quo-2", subtotal: 18_000, discount: 0, tax: 2_700, total: 20_700, customerReference: "PO-8841" },
    { id: "order-2", number: "SO-2026-000013", date: addDays(-4), expectedDate: addDays(-1), status: "invoiced", customerId: "customer-1", customerName: "Selam Trading PLC", quotationId: null, subtotal: 42_000, discount: 2_000, tax: 6_000, total: 46_000, customerReference: null },
  ],
  invoices: [
    {
      id: "invoice-1", number: "INV-2026-000044", date: addDays(-3), dueDate: addDays(27), status: "partially_paid", customerId: "customer-1", customerName: "Selam Trading PLC", orderId: "order-2", subtotal: 40_000, discount: 2_000, tax: 6_000, total: 46_000, paid: 20_000, returned: 3_450, outstanding: 22_550, credit: 0,
      items: [{ id: "invoice-item-1", productId: "product-1", description: "Yirgacheffe Coffee 1kg", warehouseId: "warehouse-1", quantity: 20, unitPrice: 2_100, taxRate: 15, lineTotal: 46_000, returnedQuantity: 1.5, returnableQuantity: 18.5 }],
    },
    {
      id: "invoice-2", number: "INV-2026-000043", date: addDays(-7), dueDate: addDays(23), status: "paid", customerId: "customer-2", customerName: "Bekele Retail Store", orderId: null, subtotal: 27_000, discount: 0, tax: 4_050, total: 31_050, paid: 31_050, returned: 0, outstanding: 0, credit: 0,
      items: [{ id: "invoice-item-2", productId: "product-2", description: "Berbere Spice 500g", warehouseId: "warehouse-1", quantity: 90, unitPrice: 300, taxRate: 15, lineTotal: 31_050, returnedQuantity: 0, returnableQuantity: 90 }],
    },
  ],
  receipts: [
    { id: "receipt-1", number: "RCPT-2026-000018", date: iso(today), customerId: "customer-1", customerName: "Selam Trading PLC", invoiceId: "invoice-1", amount: 20_000, method: "Bank transfer", reference: "FT-88210", status: "posted" },
    { id: "receipt-2", number: "RCPT-2026-000017", date: addDays(-5), customerId: "customer-2", customerName: "Bekele Retail Store", invoiceId: "invoice-2", amount: 31_050, method: "Cash", reference: null, status: "posted" },
  ],
  returns: [
    { id: "return-1", number: "RET-2026-000003", date: addDays(-1), invoiceId: "invoice-1", invoiceNumber: "INV-2026-000044", customerId: "customer-1", customerName: "Selam Trading PLC", subtotal: 3_000, tax: 450, total: 3_450, reason: "Two damaged packages returned to stock.", status: "posted" },
  ],
  customers: [
    { id: "customer-1", name: "Selam Trading PLC", email: "purchase@selamtrading.et", phone: "+251 911 234 567", tin: "0012345678", creditLimit: 250_000, paymentTermsDays: 30, invoiced: 95_800, received: 45_000, returned: 3_450, balance: 47_350, availableCredit: 202_650 },
    { id: "customer-2", name: "Bekele Retail Store", email: "bekele.retail@example.com", phone: "+251 911 345 678", tin: null, creditLimit: 75_000, paymentTermsDays: 15, invoiced: 31_050, received: 31_050, returned: 0, balance: 0, availableCredit: 75_000 },
  ],
  products: [
    { id: "product-1", sku: "YC-1KG", name: "Yirgacheffe Coffee 1kg", unitPrice: 2_100, warehouseId: "warehouse-1", warehouseName: "Main Warehouse", quantity: 72 },
    { id: "product-2", sku: "BS-500", name: "Berbere Spice 500g", unitPrice: 300, warehouseId: "warehouse-1", warehouseName: "Main Warehouse", quantity: 248 },
  ],
};
