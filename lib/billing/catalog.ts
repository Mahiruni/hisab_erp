export type BillingCycle = "monthly" | "annual";
export type CheckoutPlanCode = "starter" | "growth" | "business";

export type BillingPlan = {
  code: CheckoutPlanCode;
  name: string;
  description: string;
  monthlyAmountEtb: number;
  annualAmountEtb: number;
  users: string;
  branches: string;
  features: readonly string[];
};

export const billingPlans: readonly BillingPlan[] = [
  {
    code: "starter",
    name: "Starter",
    description: "Dependable digital records for small businesses moving beyond notebooks and disconnected spreadsheets.",
    monthlyAmountEtb: 1500,
    annualAmountEtb: 15000,
    users: "Up to 2 users",
    branches: "1 business location",
    features: [
      "Sales and expense records",
      "Customer and supplier balances",
      "Receivables and payables",
      "Essential dashboards and reports",
      "English and Amharic access",
    ],
  },
  {
    code: "growth",
    name: "Growth",
    description: "Connected inventory, purchasing, invoicing and operational controls for growing teams.",
    monthlyAmountEtb: 4500,
    annualAmountEtb: 45000,
    users: "Up to 8 users",
    branches: "Up to 2 locations",
    features: [
      "Everything in Starter",
      "Inventory and warehouse controls",
      "Purchasing and supplier obligations",
      "Invoices and collection follow-up",
      "Role-based access",
      "Priority onboarding support",
    ],
  },
  {
    code: "business",
    name: "Business",
    description: "Wider finance, reconciliation, branch and management controls for established organizations.",
    monthlyAmountEtb: 9500,
    annualAmountEtb: 95000,
    users: "Up to 25 users",
    branches: "Up to 5 locations",
    features: [
      "Everything in Growth",
      "Finance and cash-flow workspaces",
      "Payment reconciliation",
      "Multi-branch reporting",
      "Advanced roles and approvals",
      "Guided implementation and migration",
    ],
  },
] as const;

export function isBillingCycle(value: unknown): value is BillingCycle {
  return value === "monthly" || value === "annual";
}

export function isCheckoutPlanCode(value: unknown): value is CheckoutPlanCode {
  return value === "starter" || value === "growth" || value === "business";
}

export function getBillingPlan(code: unknown) {
  return isCheckoutPlanCode(code) ? billingPlans.find((plan) => plan.code === code) ?? null : null;
}

export function getPlanAmountEtb(plan: BillingPlan, cycle: BillingCycle) {
  return cycle === "annual" ? plan.annualAmountEtb : plan.monthlyAmountEtb;
}

export function formatEtb(value: number) {
  return new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 }).format(value);
}
