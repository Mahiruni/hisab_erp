export type SalesQuotationRecord = {
  id: string;
  number: string;
  date: string;
  validUntil: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";
  customerId: string;
  customerName: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
};

export type SalesOrderRecord = {
  id: string;
  number: string;
  date: string;
  expectedDate: string | null;
  status: "draft" | "confirmed" | "invoiced" | "cancelled";
  customerId: string;
  customerName: string;
  quotationId: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  customerReference: string | null;
};

export type SalesInvoiceItemRecord = {
  id: string;
  productId: string;
  description: string;
  warehouseId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
  returnedQuantity: number;
  returnableQuantity: number;
};

export type SalesInvoiceRecord = {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  status: "draft" | "posted" | "partially_paid" | "paid" | "void";
  customerId: string;
  customerName: string;
  orderId: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  returned: number;
  outstanding: number;
  credit: number;
  items: SalesInvoiceItemRecord[];
};

export type SalesReceiptRecord = {
  id: string;
  number: string;
  date: string;
  customerId: string | null;
  customerName: string | null;
  invoiceId: string | null;
  amount: number;
  method: string;
  reference: string | null;
  status: string;
};

export type SalesReturnRecord = {
  id: string;
  number: string;
  date: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  subtotal: number;
  tax: number;
  total: number;
  reason: string;
  status: string;
};

export type SalesCustomerBalanceRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tin: string | null;
  creditLimit: number;
  paymentTermsDays: number;
  invoiced: number;
  received: number;
  returned: number;
  balance: number;
  availableCredit: number;
};

export type SalesProductRecord = {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
};

export type SalesSnapshot = {
  mode: "demo" | "live";
  organizationName: string;
  metrics: {
    activeQuotations: number;
    openOrders: number;
    invoicedThisMonth: number;
    receivedThisMonth: number;
    returnsThisMonth: number;
    outstanding: number;
  };
  quotations: SalesQuotationRecord[];
  orders: SalesOrderRecord[];
  invoices: SalesInvoiceRecord[];
  receipts: SalesReceiptRecord[];
  returns: SalesReturnRecord[];
  customers: SalesCustomerBalanceRecord[];
  products: SalesProductRecord[];
};
