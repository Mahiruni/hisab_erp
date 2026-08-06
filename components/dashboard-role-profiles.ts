import type { DashboardSnapshot, UserContext } from "../lib/data/types";

export type DashboardMetricKey = keyof DashboardSnapshot["metrics"];
export type DashboardRole = UserContext["role"];
export type DashboardRoleProfile = {
  title: string;
  heading: string;
  summary: string;
  quickAction: { label: string; href: string };
  focus: Array<{ label: string; metric: DashboardMetricKey }>;
  workspace: Array<{ label: string; description: string; href: string }>;
  moduleSlugs: string[];
};

export const dashboardRoleProfiles: Record<DashboardRole, DashboardRoleProfile> = {
  owner: {
    title: "Owner",
    heading: "Executive command center",
    summary: "Monitor cash, revenue, collections, controls and launch readiness across the company.",
    quickAction: { label: "Create invoice", href: "/sales/invoices/new" },
    focus: [
      { label: "Cash visibility", metric: "cash" },
      { label: "Revenue pulse", metric: "sales" },
      { label: "Collection focus", metric: "debt" },
    ],
    workspace: [
      { label: "Company launch", description: "Complete setup and release-readiness controls.", href: "/onboarding" },
      { label: "Production controls", description: "Review security, backups, alerts and database health.", href: "/security" },
      { label: "Financial control", description: "Review accounts, journals, periods and tax configuration.", href: "/finance" },
    ],
    moduleSlugs: ["finance-accounting", "sales-invoicing", "inventory-warehouse", "reports-analytics"],
  },
  admin: {
    title: "Administrator",
    heading: "Administration control center",
    summary: "Keep company setup, users, security and operating controls ready.",
    quickAction: { label: "Review security", href: "/security" },
    focus: [
      { label: "Cash visibility", metric: "cash" },
      { label: "Operating spend", metric: "expenses" },
      { label: "Outstanding debt", metric: "debt" },
    ],
    workspace: [
      { label: "Company setup", description: "Manage branches, opening data and launch readiness.", href: "/onboarding" },
      { label: "Security controls", description: "Review MFA, alerts, backups and restore evidence.", href: "/security" },
      { label: "Account settings", description: "Manage your profile and privileged session.", href: "/account" },
    ],
    moduleSlugs: ["security-approvals-audit", "finance-accounting", "localization-compliance", "reports-analytics"],
  },
  accountant: {
    title: "Accountant",
    heading: "Finance control desk",
    summary: "Prioritize cash, journals, receivables, payables, tax and period close.",
    quickAction: { label: "Post journal", href: "/finance/journals" },
    focus: [
      { label: "Cash position", metric: "cash" },
      { label: "Operating expenses", metric: "expenses" },
      { label: "Receivables exposure", metric: "debt" },
    ],
    workspace: [
      { label: "Journal workspace", description: "Review and post balanced accounting entries.", href: "/finance/journals" },
      { label: "Finance workspace", description: "Manage accounts, taxes, periods, payments and assets.", href: "/finance" },
      { label: "Financial reports", description: "Review approved financial and operational reporting.", href: "/reports" },
    ],
    moduleSlugs: ["finance-accounting", "purchasing-expenses", "reports-analytics", "localization-compliance"],
  },
  sales: {
    title: "Sales",
    heading: "Sales command center",
    summary: "Convert demand into invoices and keep customer collections moving.",
    quickAction: { label: "Create invoice", href: "/sales/invoices/new" },
    focus: [
      { label: "Sales today", metric: "sales" },
      { label: "Cash available", metric: "cash" },
      { label: "Outstanding receivables", metric: "debt" },
    ],
    workspace: [
      { label: "New invoice", description: "Create and post the next customer invoice.", href: "/sales/invoices/new" },
      { label: "Customer workspace", description: "Review customer balances, terms and activity.", href: "/customers" },
      { label: "Sales workspace", description: "Manage sales documents, receipts and returns.", href: "/sales" },
    ],
    moduleSlugs: ["sales-invoicing", "customers-suppliers", "reports-analytics", "inventory-warehouse"],
  },
  inventory: {
    title: "Inventory",
    heading: "Inventory operations desk",
    summary: "Protect stock availability, purchasing flow, transfers and valuation controls.",
    quickAction: { label: "Open inventory", href: "/inventory" },
    focus: [
      { label: "Sales demand", metric: "sales" },
      { label: "Purchasing pressure", metric: "expenses" },
      { label: "Cash available", metric: "cash" },
    ],
    workspace: [
      { label: "Inventory workspace", description: "Review stock, transfers, counts and reorder signals.", href: "/inventory" },
      { label: "Purchasing workspace", description: "Review requests, orders, supplier bills and spend.", href: "/purchasing" },
      { label: "Inventory controls", description: "Review valuation, negative-stock and audit controls.", href: "/modules/inventory-warehouse" },
    ],
    moduleSlugs: ["inventory-warehouse", "purchasing-expenses", "reports-analytics", "finance-accounting"],
  },
  manager: {
    title: "Manager",
    heading: "Operations command center",
    summary: "Coordinate sales, spending, stock and team execution from one view.",
    quickAction: { label: "Open reports", href: "/reports" },
    focus: [
      { label: "Revenue pulse", metric: "sales" },
      { label: "Expense control", metric: "expenses" },
      { label: "Collection focus", metric: "debt" },
    ],
    workspace: [
      { label: "Management reports", description: "Review performance, exceptions and operating trends.", href: "/reports" },
      { label: "Sales operations", description: "Review invoices, collections and customer activity.", href: "/sales" },
      { label: "Inventory operations", description: "Review availability, movement and purchasing pressure.", href: "/inventory" },
    ],
    moduleSlugs: ["reports-analytics", "sales-invoicing", "inventory-warehouse", "purchasing-expenses"],
  },
  staff: {
    title: "Staff",
    heading: "Daily work center",
    summary: "Continue assigned operational work with clear shortcuts and shared business context.",
    quickAction: { label: "Open modules", href: "/modules" },
    focus: [
      { label: "Revenue pulse", metric: "sales" },
      { label: "Cash visibility", metric: "cash" },
      { label: "Expense control", metric: "expenses" },
    ],
    workspace: [
      { label: "Assigned modules", description: "Open the ERP modules available to your role.", href: "/modules" },
      { label: "Customer workspace", description: "Review approved customer and supplier information.", href: "/customers" },
      { label: "Shared reports", description: "Review reports available to your assigned permissions.", href: "/reports" },
    ],
    moduleSlugs: ["sales-invoicing", "inventory-warehouse", "customers-suppliers", "reports-analytics"],
  },
  viewer: {
    title: "Viewer",
    heading: "Reporting workspace",
    summary: "Review approved business information without changing operational records.",
    quickAction: { label: "Open reports", href: "/reports" },
    focus: [
      { label: "Revenue overview", metric: "sales" },
      { label: "Expense overview", metric: "expenses" },
      { label: "Outstanding debt", metric: "debt" },
    ],
    workspace: [
      { label: "Reporting center", description: "Review approved financial and operating reports.", href: "/reports" },
      { label: "Finance overview", description: "Review accounts, balances and posted journals.", href: "/finance" },
      { label: "Audit and controls", description: "Review security, audit and production-control evidence.", href: "/security" },
    ],
    moduleSlugs: ["reports-analytics", "finance-accounting", "security-approvals-audit", "localization-compliance"],
  },
};
