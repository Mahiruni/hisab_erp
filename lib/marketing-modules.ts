export type MarketingModule = {
  slug: string;
  number: string;
  shortTitle: string;
  title: string;
  eyebrow: string;
  summary: string;
  problem: string;
  outcome: string;
  features: string[];
  workflow: Array<{ step: string; title: string; description: string }>;
  metrics: Array<{ label: string; value: string; note: string }>;
  audiences: string[];
  previewRows: Array<{ label: string; value: string; meta: string }>;
};

export const marketingModules: MarketingModule[] = [
  {
    slug: "sales-invoicing",
    number: "01",
    shortTitle: "Sales & invoicing",
    title: "Sell, invoice and collect with complete visibility.",
    eyebrow: "Revenue operations",
    summary: "Create sales, issue professional invoices, track collections and understand revenue without moving between disconnected tools.",
    problem: "Manual sales records make it difficult to know what was sold, what has been paid and which customers still owe money.",
    outcome: "HisabERP creates one reliable sales trail from transaction to invoice, payment and management reporting.",
    features: [
      "Fast sales entry for products and services",
      "Professional invoice generation",
      "Paid, partial and outstanding balance tracking",
      "Customer sales history and statements",
      "Daily, weekly and monthly revenue summaries",
      "Role-controlled cashier and manager workflows",
    ],
    workflow: [
      { step: "01", title: "Create the sale", description: "Choose the customer, products or services, quantities, price and payment terms." },
      { step: "02", title: "Issue the invoice", description: "Generate a clear invoice and preserve the complete transaction record." },
      { step: "03", title: "Track collection", description: "Record payments and follow outstanding balances until the account is settled." },
    ],
    metrics: [
      { label: "Today’s revenue", value: "ETB 84,600", note: "+12.8% this week" },
      { label: "Outstanding", value: "ETB 26,450", note: "4 invoices due" },
      { label: "Average sale", value: "ETB 3,240", note: "Across 31 sales" },
    ],
    audiences: ["Retailers", "Wholesalers", "Service businesses", "Restaurants", "Multi-branch teams"],
    previewRows: [
      { label: "INV-1048 · Abeba Trading", value: "ETB 18,900", meta: "Paid" },
      { label: "INV-1047 · Nuru Market", value: "ETB 12,400", meta: "Partial" },
      { label: "INV-1046 · Selam Services", value: "ETB 8,750", meta: "Due Friday" },
    ],
  },
  {
    slug: "expenses-purchasing",
    number: "02",
    shortTitle: "Expenses & purchasing",
    title: "Control spending before it controls the business.",
    eyebrow: "Cost management",
    summary: "Record expenses, manage purchases, understand supplier obligations and see where operational cash is going.",
    problem: "When receipts, supplier purchases and operating costs are recorded separately, owners lose a reliable picture of profitability.",
    outcome: "HisabERP connects every purchase and expense to suppliers, categories, payment status and financial reporting.",
    features: [
      "Expense categorization and supporting notes",
      "Supplier purchase and bill tracking",
      "Paid and outstanding obligation management",
      "Recurring operational expense visibility",
      "Purchase history by supplier and category",
      "Approval-ready records and audit trail",
    ],
    workflow: [
      { step: "01", title: "Record the obligation", description: "Capture the supplier, category, amount, due date and supporting reference." },
      { step: "02", title: "Review and pay", description: "Confirm the purchase or expense and record full or partial payments." },
      { step: "03", title: "Analyze cost", description: "Compare spending by category, supplier, branch and reporting period." },
    ],
    metrics: [
      { label: "Monthly expenses", value: "ETB 126,800", note: "8.4% below budget" },
      { label: "Supplier payables", value: "ETB 41,200", note: "6 open bills" },
      { label: "Largest category", value: "Inventory", note: "42% of spending" },
    ],
    audiences: ["Finance teams", "Purchasing teams", "Owners", "Branch managers", "Operations teams"],
    previewRows: [
      { label: "Meron Distribution", value: "ETB 34,500", meta: "Due in 5 days" },
      { label: "Workspace rent", value: "ETB 22,000", meta: "Paid" },
      { label: "Transport & delivery", value: "ETB 7,850", meta: "This month" },
    ],
  },
  {
    slug: "inventory",
    number: "03",
    shortTitle: "Inventory",
    title: "Know what is in stock, what is moving and what needs attention.",
    eyebrow: "Stock control",
    summary: "Track quantities, movements, low-stock risk and product performance across daily business operations.",
    problem: "Inaccurate stock records create lost sales, unnecessary purchasing, theft risk and unreliable financial reporting.",
    outcome: "HisabERP maintains a live stock position connected to sales, purchasing and operational adjustments.",
    features: [
      "Real-time stock quantities and movement history",
      "Low-stock and reorder attention lists",
      "Product, category and unit organization",
      "Sales and purchase-linked stock updates",
      "Inventory valuation and movement summaries",
      "Branch and warehouse-ready structure",
    ],
    workflow: [
      { step: "01", title: "Create the catalogue", description: "Add products, units, categories, selling prices and opening quantities." },
      { step: "02", title: "Connect movement", description: "Sales, purchases and adjustments update available stock consistently." },
      { step: "03", title: "Act on risk", description: "Review low-stock items, slow movement and high-performing products." },
    ],
    metrics: [
      { label: "Inventory value", value: "ETB 684,200", note: "Across 146 items" },
      { label: "Low stock", value: "9 items", note: "3 require action" },
      { label: "Fastest mover", value: "Item A-24", note: "86 units this week" },
    ],
    audiences: ["Retailers", "Wholesalers", "Warehouses", "Restaurants", "Multi-location businesses"],
    previewRows: [
      { label: "Premium Coffee 1kg", value: "48 units", meta: "Healthy" },
      { label: "Cooking Oil 5L", value: "7 units", meta: "Reorder" },
      { label: "Packaging Box M", value: "126 units", meta: "Stable" },
    ],
  },
  {
    slug: "customers-suppliers",
    number: "04",
    shortTitle: "Customers & suppliers",
    title: "Keep every business relationship and balance in one place.",
    eyebrow: "Relationship records",
    summary: "Maintain customer and supplier histories, balances, contacts, transactions and follow-up information.",
    problem: "Scattered contact lists and handwritten balances make it difficult to serve customers and manage supplier commitments professionally.",
    outcome: "HisabERP gives each relationship a complete operational and financial history.",
    features: [
      "Customer and supplier profiles",
      "Transaction, invoice and payment history",
      "Receivable and payable balances",
      "Statements and account activity",
      "Contact and follow-up information",
      "Searchable relationship records",
    ],
    workflow: [
      { step: "01", title: "Create the profile", description: "Store identity, contact details, terms and important business notes." },
      { step: "02", title: "Connect transactions", description: "Sales, purchases, invoices and payments build the account history." },
      { step: "03", title: "Manage the balance", description: "Review statements, outstanding amounts and follow-up priorities." },
    ],
    metrics: [
      { label: "Active customers", value: "284", note: "36 purchased this month" },
      { label: "Receivables", value: "ETB 72,900", note: "11 open accounts" },
      { label: "Active suppliers", value: "38", note: "6 have balances" },
    ],
    audiences: ["Sales teams", "Finance teams", "Purchasing teams", "Account managers", "Business owners"],
    previewRows: [
      { label: "Abeba Trading PLC", value: "ETB 18,900", meta: "Receivable" },
      { label: "Meron Distribution", value: "ETB 34,500", meta: "Payable" },
      { label: "Nuru Market", value: "ETB 0", meta: "Settled" },
    ],
  },
  {
    slug: "finance-cashflow",
    number: "05",
    shortTitle: "Finance & cash flow",
    title: "Understand the financial position without waiting for month-end.",
    eyebrow: "Financial control",
    summary: "Monitor cash, income, expenses, receivables, payables and operating performance from one decision-ready workspace.",
    problem: "Business activity can look strong while cash is unavailable, debts are growing or expenses are eroding profitability.",
    outcome: "HisabERP turns daily operational records into a current view of financial health and required action.",
    features: [
      "Cash position and movement visibility",
      "Income and expense summaries",
      "Receivable and payable monitoring",
      "Profitability and margin indicators",
      "Period comparison and trend analysis",
      "Management-ready financial overview",
    ],
    workflow: [
      { step: "01", title: "Capture operations", description: "Sales, expenses, purchases and payments enter one connected record system." },
      { step: "02", title: "Review position", description: "See cash, obligations, collections and operating results together." },
      { step: "03", title: "Make the decision", description: "Use attention lists and trends to prioritize collection, spending and growth." },
    ],
    metrics: [
      { label: "Cash available", value: "ETB 318,400", note: "Across active accounts" },
      { label: "Net cash flow", value: "ETB 96,240", note: "Positive this month" },
      { label: "Operating margin", value: "31.8%", note: "+4.2 points" },
    ],
    audiences: ["Owners", "Finance leaders", "Accountants", "General managers", "Branch managers"],
    previewRows: [
      { label: "Collections received", value: "ETB 148,600", meta: "This month" },
      { label: "Operating expenses", value: "ETB 126,800", meta: "This month" },
      { label: "Supplier payments", value: "ETB 52,400", meta: "This month" },
    ],
  },
  {
    slug: "bank-reconciliation",
    number: "06",
    shortTitle: "Bank reconciliation",
    title: "Match payments and records before small differences become large problems.",
    eyebrow: "Transaction assurance",
    summary: "Review recorded transactions against bank and digital-payment activity to identify missing, duplicated or unmatched items.",
    problem: "Unmatched deposits, fees, transfers and payment records make cash reporting unreliable and increase fraud or error risk.",
    outcome: "HisabERP provides a controlled reconciliation workflow with clear exceptions and resolution history.",
    features: [
      "Bank and digital-payment reconciliation workspace",
      "Matched and unmatched transaction queues",
      "Difference and exception identification",
      "Resolution notes and audit history",
      "Period closing support",
      "Payment-channel visibility",
    ],
    workflow: [
      { step: "01", title: "Bring in activity", description: "Load or review bank and payment-channel transactions for the period." },
      { step: "02", title: "Match records", description: "Connect external activity to the corresponding HisabERP transaction." },
      { step: "03", title: "Resolve exceptions", description: "Investigate differences and preserve the closing evidence." },
    ],
    metrics: [
      { label: "Matched", value: "142", note: "96.6% of activity" },
      { label: "Unmatched", value: "5", note: "Requires review" },
      { label: "Difference", value: "ETB 1,840", note: "Across open items" },
    ],
    audiences: ["Accountants", "Finance controllers", "Payment teams", "Auditors", "Business owners"],
    previewRows: [
      { label: "Bank deposit · 18 Jul", value: "ETB 42,600", meta: "Matched" },
      { label: "telebirr settlement", value: "ETB 16,850", meta: "Review" },
      { label: "Bank service fee", value: "ETB 420", meta: "Unrecorded" },
    ],
  },
  {
    slug: "reports-analytics",
    number: "07",
    shortTitle: "Reports & analytics",
    title: "Turn operational records into decisions people can act on.",
    eyebrow: "Business intelligence",
    summary: "Review performance, trends, balances and operational signals without rebuilding reports in spreadsheets.",
    problem: "When reporting depends on manual consolidation, decisions arrive late and teams debate which numbers are correct.",
    outcome: "HisabERP creates a consistent reporting layer from the same records used to run the business.",
    features: [
      "Revenue, expense and profitability reporting",
      "Receivable and payable reports",
      "Inventory movement and performance reports",
      "Period comparison and trend views",
      "Branch and category-ready analysis",
      "Exportable management information",
    ],
    workflow: [
      { step: "01", title: "Choose the question", description: "Select the business area, period and level of detail to review." },
      { step: "02", title: "Understand the trend", description: "Compare performance, balances and exceptions using consistent data." },
      { step: "03", title: "Share the result", description: "Use the report for management review, follow-up and operational action." },
    ],
    metrics: [
      { label: "Revenue growth", value: "+24%", note: "Versus prior period" },
      { label: "Expense ratio", value: "68.2%", note: "Improved 3.1 points" },
      { label: "Collection rate", value: "91.4%", note: "Current period" },
    ],
    audiences: ["Executives", "Owners", "Finance teams", "Operations leaders", "Advisors"],
    previewRows: [
      { label: "Revenue performance", value: "+24%", meta: "Improving" },
      { label: "Outstanding debt", value: "ETB 72,900", meta: "11 accounts" },
      { label: "Inventory turnover", value: "4.8×", meta: "Current quarter" },
    ],
  },
  {
    slug: "hr-payroll",
    number: "08",
    shortTitle: "HR & payroll",
    title: "Organize people, payroll records and workforce responsibilities.",
    eyebrow: "Workforce operations",
    summary: "Maintain employee information, roles, compensation records and payroll workflows inside the same controlled business platform.",
    problem: "Separate employee files and payroll calculations create privacy, accuracy and access-control risks.",
    outcome: "HisabERP provides a role-aware foundation for workforce administration and payroll operations.",
    features: [
      "Employee profiles and role information",
      "Compensation and payroll-period records",
      "Department and branch organization",
      "Controlled access to sensitive workforce data",
      "Payroll history and reporting foundation",
      "Onboarding and employment-status tracking",
    ],
    workflow: [
      { step: "01", title: "Set up the workforce", description: "Create employee profiles, roles, departments and compensation details." },
      { step: "02", title: "Prepare the period", description: "Review payroll inputs, changes and approval responsibilities." },
      { step: "03", title: "Preserve the record", description: "Maintain a controlled payroll history for reporting and review." },
    ],
    metrics: [
      { label: "Active employees", value: "42", note: "Across 4 departments" },
      { label: "Monthly payroll", value: "ETB 468,000", note: "Current period" },
      { label: "Pending changes", value: "3", note: "Awaiting review" },
    ],
    audiences: ["HR teams", "Payroll teams", "Owners", "Department leaders", "Finance teams"],
    previewRows: [
      { label: "July payroll", value: "ETB 468,000", meta: "In review" },
      { label: "New employees", value: "3 people", meta: "This month" },
      { label: "Department changes", value: "2 updates", meta: "Pending" },
    ],
  },
];

export function getMarketingModule(slug: string) {
  return marketingModules.find((module) => module.slug === slug);
}
