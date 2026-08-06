export type UserContext = {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
  branchId: string | null;
  role: "owner" | "admin" | "accountant" | "sales" | "inventory" | "manager" | "staff" | "viewer";
  avatarUrl: string | null;
  provider: string | null;
  aal: "aal1" | "aal2";
  mfaRequired: boolean;
};

export type DashboardSnapshot = {
  mode: "demo" | "live";
  userName: string;
  organizationName: string;
  metrics: { sales: number; expenses: number; cash: number; debt: number };
  monthlyRevenue: number[];
  recentTransactions: Array<{ id: string; description: string; category: string; date: string; amount: number; type: "income" | "expense" }>;
  health: { score: number; cashFlow: "strong" | "good" | "attention"; expenseControl: "strong" | "good" | "attention"; debtCollection: "strong" | "good" | "attention" };
};

export type CustomerRecord = { id: string; name: string; email: string | null; phone: string | null; tin: string | null; creditLimit: number };
export type ProductRecord = { id: string; sku: string; name: string; quantity: number; reorderLevel: number; unitPrice: number; warehouseName: string };
export type JournalRecord = { id: string; number: string; date: string; memo: string; status: string; debit: number; credit: number };

export type FinanceAccountRecord = {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  subtype: string | null;
  normalSide: "debit" | "credit";
  currency: string;
  debit: number;
  credit: number;
  balance: number;
  system: boolean;
};

export type FinancePaymentRecord = {
  id: string;
  number: string;
  type: "receipt" | "payment";
  amount: number;
  taxAmount: number;
  method: string;
  date: string;
  counterparty: string | null;
  reference: string | null;
  status: string;
};

export type FinancePeriodRecord = { id: string; name: string; startDate: string; endDate: string; status: "open" | "soft_closed" | "locked"; lockedAt: string | null };
export type FinanceTaxCodeRecord = { id: string; code: string; name: string; rate: number; type: "output" | "input" | "withholding" | "exempt"; accountId: string | null; balance: number; active: boolean };
export type FinanceAssetRecord = { id: string; number: string; name: string; category: string; acquisitionDate: string; inServiceDate: string; cost: number; salvageValue: number; usefulLifeMonths: number; accumulatedDepreciation: number; bookValue: number; status: "draft" | "active" | "fully_depreciated" | "disposed" };
export type FinanceInvoiceRecord = { id: string; number: string; customerId: string; total: number; paid: number; outstanding: number; status: "posted" | "partially_paid" };

export type FinanceSnapshot = {
  mode: "demo" | "live";
  organizationName: string;
  metrics: { cash: number; receivables: number; payables: number; revenue: number; expenses: number; assets: number; liabilities: number; equity: number };
  accounts: FinanceAccountRecord[];
  journals: JournalRecord[];
  payments: FinancePaymentRecord[];
  periods: FinancePeriodRecord[];
  taxCodes: FinanceTaxCodeRecord[];
  assets: FinanceAssetRecord[];
  customers: Array<{ id: string; name: string }>;
  invoices: FinanceInvoiceRecord[];
};
