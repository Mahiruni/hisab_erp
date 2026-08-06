import type { CustomerRecord, DashboardSnapshot, FinanceSnapshot, JournalRecord, ProductRecord } from "./types";

export const demoDashboard: DashboardSnapshot = {
  mode: "demo",
  userName: "Mahir",
  organizationName: "Hisab Trading Enterprise",
  metrics: { sales: 48_250, expenses: 12_840, cash: 186_400, debt: 74_600 },
  monthlyRevenue: [42_000, 56_000, 48_000, 68_000, 61_000, 78_000, 72_000, 88_000, 82_000, 96_000, 91_000, 108_000],
  recentTransactions: [
    { id: "TRX-1048", description: "Wholesale order — Abebe Market", category: "Sales", date: new Date().toISOString(), amount: 18_500, type: "income" },
    { id: "TRX-1047", description: "Office internet and utilities", category: "Operations", date: new Date().toISOString(), amount: 4_250, type: "expense" },
    { id: "TRX-1046", description: "Retail sales — Bole branch", category: "Sales", date: new Date(Date.now() - 86_400_000).toISOString(), amount: 12_800, type: "income" },
    { id: "TRX-1045", description: "Inventory restock", category: "Purchases", date: new Date(Date.now() - 86_400_000).toISOString(), amount: 8_590, type: "expense" },
  ],
  health: { score: 86, cashFlow: "strong", expenseControl: "good", debtCollection: "attention" },
};

export const demoCustomers: CustomerRecord[] = [
  { id: "demo-c1", name: "Selam Trading PLC", email: "purchase@selamtrading.et", phone: "+251 911 234 567", tin: "0012345678", creditLimit: 250_000 },
  { id: "demo-c2", name: "Bekele Retail Store", email: "bekele.retail@example.com", phone: "+251 911 345 678", tin: null, creditLimit: 75_000 },
];

export const demoProducts: ProductRecord[] = [
  { id: "demo-p1", sku: "BS-500", name: "Berbere Spice 500g", quantity: 248, reorderLevel: 50, unitPrice: 300, warehouseName: "Addis Ababa" },
  { id: "demo-p2", sku: "YC-1KG", name: "Yirgacheffe Coffee 1kg", quantity: 18, reorderLevel: 30, unitPrice: 600, warehouseName: "Addis Ababa" },
];

export const demoJournals: JournalRecord[] = [
  { id: "demo-j1", number: "JE-2026-0001", date: new Date().toISOString().slice(0, 10), memo: "Opening balances", status: "posted", debit: 1_000_000, credit: 1_000_000 },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

export const demoFinance: FinanceSnapshot = {
  mode: "demo",
  organizationName: "Hisab Trading Enterprise",
  metrics: {
    cash: 186_400,
    receivables: 74_600,
    payables: 39_250,
    revenue: 108_000,
    expenses: 32_840,
    assets: 684_300,
    liabilities: 156_900,
    equity: 527_400,
  },
  accounts: [
    { id: "a1000", code: "1000", name: "Cash on Hand", type: "asset", subtype: "cash", normalSide: "debit", currency: "ETB", debit: 243_900, credit: 57_500, balance: 186_400, system: true },
    { id: "a1010", code: "1010", name: "Bank Accounts", type: "asset", subtype: "bank", normalSide: "debit", currency: "ETB", debit: 310_000, credit: 68_000, balance: 242_000, system: true },
    { id: "a1100", code: "1100", name: "Accounts Receivable", type: "asset", subtype: "receivable", normalSide: "debit", currency: "ETB", debit: 182_600, credit: 108_000, balance: 74_600, system: true },
    { id: "a1300", code: "1300", name: "Input VAT Recoverable", type: "asset", subtype: "tax", normalSide: "debit", currency: "ETB", debit: 8_240, credit: 0, balance: 8_240, system: true },
    { id: "a1500", code: "1500", name: "Property, Plant & Equipment", type: "asset", subtype: "fixed_asset", normalSide: "debit", currency: "ETB", debit: 180_000, credit: 0, balance: 180_000, system: true },
    { id: "a1510", code: "1510", name: "Accumulated Depreciation", type: "asset", subtype: "contra_asset", normalSide: "credit", currency: "ETB", debit: 0, credit: 6_940, balance: 6_940, system: true },
    { id: "a2000", code: "2000", name: "Accounts Payable", type: "liability", subtype: "payable", normalSide: "credit", currency: "ETB", debit: 42_000, credit: 81_250, balance: 39_250, system: true },
    { id: "a2100", code: "2100", name: "Output VAT Payable", type: "liability", subtype: "tax", normalSide: "credit", currency: "ETB", debit: 0, credit: 16_200, balance: 16_200, system: true },
    { id: "a3000", code: "3000", name: "Owner Equity", type: "equity", subtype: "equity", normalSide: "credit", currency: "ETB", debit: 0, credit: 527_400, balance: 527_400, system: true },
    { id: "a4000", code: "4000", name: "Sales Revenue", type: "revenue", subtype: "sales", normalSide: "credit", currency: "ETB", debit: 0, credit: 108_000, balance: 108_000, system: true },
    { id: "a5000", code: "5000", name: "Cost of Goods Sold", type: "expense", subtype: "cogs", normalSide: "debit", currency: "ETB", debit: 21_500, credit: 0, balance: 21_500, system: true },
    { id: "a6000", code: "6000", name: "Operating Expenses", type: "expense", subtype: "operating_expense", normalSide: "debit", currency: "ETB", debit: 10_340, credit: 0, balance: 10_340, system: true },
    { id: "a6100", code: "6100", name: "Depreciation Expense", type: "expense", subtype: "depreciation", normalSide: "debit", currency: "ETB", debit: 1_000, credit: 0, balance: 1_000, system: true },
  ],
  journals: [
    { id: "fj1", number: "JE-2026-000128", date: new Date().toISOString().slice(0, 10), memo: "Receipt RCPT-2026-000018", status: "posted", debit: 18_500, credit: 18_500 },
    { id: "fj2", number: "JE-2026-000127", date: new Date().toISOString().slice(0, 10), memo: "Office utilities", status: "posted", debit: 4_887.5, credit: 4_887.5 },
    { id: "fj3", number: "JE-2026-000126", date: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10), memo: "Sales invoice INV-2026-000044", status: "posted", debit: 14_720, credit: 14_720 },
  ],
  payments: [
    { id: "pay1", number: "RCPT-2026-000018", type: "receipt", amount: 18_500, taxAmount: 0, method: "Bank transfer", date: new Date().toISOString().slice(0, 10), counterparty: "Selam Trading PLC", reference: "FT-88210", status: "posted" },
    { id: "pay2", number: "PAY-2026-000032", type: "payment", amount: 4_887.5, taxAmount: 637.5, method: "Mobile money", date: new Date().toISOString().slice(0, 10), counterparty: "Ethio telecom", reference: "UTIL-JUL", status: "posted" },
  ],
  periods: Array.from({ length: 6 }, (_, index) => {
    const month = currentMonth - index;
    const date = new Date(currentYear, month, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
      id: `period-${index}`,
      name: new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date),
      startDate: date.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      status: index > 2 ? "locked" as const : index === 2 ? "soft_closed" as const : "open" as const,
      lockedAt: index > 2 ? end.toISOString() : null,
    };
  }),
  taxCodes: [
    { id: "tax-out", code: "VAT15-OUT", name: "VAT 15% Output", rate: 15, type: "output", accountId: "a2100", balance: 16_200, active: true },
    { id: "tax-in", code: "VAT15-IN", name: "VAT 15% Input", rate: 15, type: "input", accountId: "a1300", balance: 8_240, active: true },
  ],
  assets: [
    { id: "asset-1", number: "AST-2026-000001", name: "Delivery Vehicle", category: "Vehicles", acquisitionDate: `${currentYear}-01-15`, inServiceDate: `${currentYear}-02-01`, cost: 180_000, salvageValue: 20_000, usefulLifeMonths: 60, accumulatedDepreciation: 6_940, bookValue: 173_060, status: "active" },
  ],
  customers: demoCustomers.map(({ id, name }) => ({ id, name })),
  invoices: [
    { id: "inv-1", number: "INV-2026-000044", customerId: "demo-c1", total: 42_550, paid: 18_500, outstanding: 24_050, status: "partially_paid" },
  ],
};