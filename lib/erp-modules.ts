export type ModulePriority = "Must have" | "Should have" | "Growth";

export type ErpModule = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  priority: ModulePriority;
  phase: number;
  features: string[];
  controls: string[];
};

export const erpModules: ErpModule[] = [
  {
    slug: "finance-accounting",
    title: "Finance & Accounting",
    shortTitle: "Finance",
    description: "The financial source of truth for every sale, expense, payment, tax, asset and closing period.",
    priority: "Must have",
    phase: 1,
    features: ["Chart of accounts", "Double-entry journals", "Accounts receivable", "Accounts payable", "Cash and bank management", "Profit and loss, balance sheet and cash flow"],
    controls: ["Period locking", "Balanced journal validation", "Approval limits", "Immutable posting history"],
  },
  {
    slug: "sales-invoicing",
    title: "Sales & Invoicing",
    shortTitle: "Sales",
    description: "Manage quotations, sales orders, invoices, receipts, returns and customer balances from one workflow.",
    priority: "Must have",
    phase: 1,
    features: ["Quotations", "Sales orders", "Invoices and receipts", "Credit notes and returns", "Payment status", "Customer statements"],
    controls: ["Unique document numbers", "Price and discount approvals", "Tax calculation", "Invoice status history"],
  },
  {
    slug: "purchasing-expenses",
    title: "Purchasing & Expenses",
    shortTitle: "Purchasing",
    description: "Control spending from request and approval through purchase order, supplier invoice and payment.",
    priority: "Must have",
    phase: 1,
    features: ["Purchase requests", "Purchase orders", "Supplier bills", "Expense claims", "Three-way matching", "Supplier balances"],
    controls: ["Approval workflows", "Budget checks", "Duplicate invoice detection", "Separation of duties"],
  },
  {
    slug: "inventory-warehouse",
    title: "Inventory & Warehouse",
    shortTitle: "Inventory",
    description: "Track products, stock movements, valuation, reorder levels and transfers across locations.",
    priority: "Must have",
    phase: 1,
    features: ["Product catalogue", "Stock receipts and issues", "Warehouse transfers", "Reorder alerts", "Batch and serial tracking", "Inventory valuation"],
    controls: ["Negative stock rules", "Stock count reconciliation", "Movement audit trail", "Role-based adjustments"],
  },
  {
    slug: "customers-suppliers",
    title: "Customers & Suppliers",
    shortTitle: "Contacts",
    description: "A shared business directory with credit terms, tax details, contacts, balances and complete activity history.",
    priority: "Must have",
    phase: 1,
    features: ["Customer profiles", "Supplier profiles", "Credit limits", "Payment terms", "TIN and tax information", "Activity timeline"],
    controls: ["Duplicate detection", "Credit hold", "Data access restrictions", "Change history"],
  },
  {
    slug: "security-approvals-audit",
    title: "Security, Approvals & Audit",
    shortTitle: "Security",
    description: "Protect company data with role-based access, approvals, audit logs and accountable user activity.",
    priority: "Must have",
    phase: 1,
    features: ["User and role management", "Approval inbox", "Audit trail", "Login and session history", "Sensitive action confirmation", "Data export controls"],
    controls: ["Least-privilege access", "Multi-factor authentication readiness", "Tamper-resistant audit events", "Session expiration"],
  },
  {
    slug: "reports-analytics",
    title: "Reports & Analytics",
    shortTitle: "Reports",
    description: "Give owners and managers real-time operational, financial and exception reporting.",
    priority: "Must have",
    phase: 1,
    features: ["Financial statements", "Sales and margin reports", "Expense analysis", "Aging reports", "Inventory reports", "CSV and PDF export"],
    controls: ["Report permissions", "Consistent filters", "Saved report definitions", "Export audit events"],
  },
  {
    slug: "localization-compliance",
    title: "Localization & Compliance",
    shortTitle: "Compliance",
    description: "Configure company, branch, currency, language, tax and document rules for the market where the business operates.",
    priority: "Must have",
    phase: 1,
    features: ["ETB and multi-currency", "English and Amharic", "Tax configuration", "TIN and branch details", "Fiscal periods", "Localized invoice templates"],
    controls: ["Tax-rate effective dates", "Locked legal fields", "Document retention settings", "Compliance configuration history"],
  },
  {
    slug: "human-resources-payroll",
    title: "Human Resources & Payroll",
    shortTitle: "HR & Payroll",
    description: "Manage employees, attendance, leave, payroll inputs, contracts and workforce costs.",
    priority: "Should have",
    phase: 2,
    features: ["Employee records", "Attendance", "Leave management", "Payroll runs", "Allowances and deductions", "Payslips"],
    controls: ["Private employee data", "Payroll approvals", "Change tracking", "Restricted exports"],
  },
  {
    slug: "fixed-assets",
    title: "Fixed Assets",
    shortTitle: "Assets",
    description: "Register company assets and calculate depreciation, transfers, maintenance and disposals.",
    priority: "Should have",
    phase: 2,
    features: ["Asset register", "Depreciation schedules", "Asset assignment", "Maintenance history", "Transfers", "Disposals"],
    controls: ["Capitalization approval", "Depreciation period locks", "Custodian history", "Disposal approval"],
  },
  {
    slug: "budgeting-projects",
    title: "Budgeting & Projects",
    shortTitle: "Budgets",
    description: "Plan budgets and track project revenue, costs, milestones and profitability against actual results.",
    priority: "Should have",
    phase: 2,
    features: ["Department budgets", "Budget versus actual", "Projects and tasks", "Project billing", "Cost allocation", "Profitability tracking"],
    controls: ["Budget ownership", "Variance alerts", "Project approval", "Closed-project protection"],
  },
  {
    slug: "integrations-automation",
    title: "Integrations & Automation",
    shortTitle: "Integrations",
    description: "Connect payments, banks, e-commerce, messaging and external systems through secure APIs and workflows.",
    priority: "Growth",
    phase: 3,
    features: ["REST API", "Webhooks", "Payment integrations", "Bank import", "Email and messaging", "Workflow automation"],
    controls: ["API keys and scopes", "Webhook signatures", "Retry and failure logs", "Integration audit trail"],
  },
];

export const mustHaveModules = erpModules.filter((module) => module.priority === "Must have");

export function getErpModule(slug: string) {
  return erpModules.find((module) => module.slug === slug);
}
