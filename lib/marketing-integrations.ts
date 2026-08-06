export type IntegrationStatus = "available" | "configuration" | "beta" | "planned";

export type MarketingIntegration = {
  name: string;
  category: string;
  status: IntegrationStatus;
  statusLabel: string;
  summary: string;
  capabilities: string[];
  requirement: string;
};

export const integrationStatusCopy: Record<IntegrationStatus, { label: string; description: string }> = {
  available: { label: "Available", description: "Implemented in the current HisabERP application." },
  configuration: { label: "Configuration required", description: "The product path exists, but the organization or deployment must provide provider credentials or enable the control." },
  beta: { label: "Beta", description: "Implemented for controlled evaluation and provider-specific setup before broad production use." },
  planned: { label: "Planned", description: "Published as roadmap direction, not as an active integration." },
};

export const marketingIntegrations: MarketingIntegration[] = [
  {
    name: "Supabase platform",
    category: "Cloud foundation",
    status: "available",
    statusLabel: "Available",
    summary: "HisabERP uses Supabase for authenticated application access and its PostgreSQL data foundation.",
    capabilities: ["Session-based authentication", "PostgreSQL application data", "Organization-scoped access model"],
    requirement: "Configured as the core application platform.",
  },
  {
    name: "Email and magic-link access",
    category: "Identity",
    status: "available",
    statusLabel: "Available",
    summary: "Users can access HisabERP with email and password or request a password-free magic sign-in link.",
    capabilities: ["Email sign-in", "Email registration", "Password reset", "Magic-link authentication"],
    requirement: "Requires the deployment email and Supabase authentication settings to remain configured.",
  },
  {
    name: "Google sign-in",
    category: "Identity",
    status: "configuration",
    statusLabel: "Configuration required",
    summary: "The application includes the Google OAuth sign-in path for organizations that prefer managed identity access.",
    capabilities: ["Google OAuth entry", "Redirect back to the requested workspace", "Existing-account authentication flow"],
    requirement: "Google OAuth credentials and callback settings must be enabled in Supabase.",
  },
  {
    name: "Apple sign-in",
    category: "Identity",
    status: "configuration",
    statusLabel: "Configuration required",
    summary: "The application includes an Apple OAuth sign-in path for deployments that configure the provider.",
    capabilities: ["Apple OAuth entry", "Redirect back to the requested workspace", "Existing-account authentication flow"],
    requirement: "Apple developer credentials and callback settings must be enabled in Supabase.",
  },
  {
    name: "telebirr reconciliation callbacks",
    category: "Payments and reconciliation",
    status: "beta",
    statusLabel: "Beta",
    summary: "HisabERP can receive token-protected telebirr callback events and normalize them into the reconciliation workflow.",
    capabilities: ["Provider callback endpoint", "ETB transaction normalization", "Transaction, order and payer references", "Organization source mapping"],
    requirement: "Requires a callback token, source reference and provider-specific implementation validation before production rollout.",
  },
  {
    name: "M-PESA Daraja reconciliation callbacks",
    category: "Payments and reconciliation",
    status: "beta",
    statusLabel: "Beta",
    summary: "HisabERP can receive M-PESA Daraja callback events and normalize receipt, amount, phone and order references for reconciliation.",
    capabilities: ["Daraja callback endpoint", "Receipt and checkout references", "Amount and phone normalization", "Token validation"],
    requirement: "Requires Daraja credentials, callback token configuration and controlled provider testing.",
  },
  {
    name: "Audit CSV export",
    category: "Data exchange",
    status: "available",
    statusLabel: "Available",
    summary: "MFA-verified administrators can export enabled business, authentication and security-alert evidence as spreadsheet-safe CSV.",
    capabilities: ["Business audit export", "Authentication audit export", "Security-alert evidence", "Defined reporting window"],
    requirement: "Audit export must be enabled in production controls and the administrator session must be AAL2 verified.",
  },
  {
    name: "External monitoring webhook",
    category: "Operations",
    status: "configuration",
    statusLabel: "Configuration required",
    summary: "Structured server errors can be forwarded from the deployment to an external monitoring endpoint.",
    capabilities: ["Structured error forwarding", "Deployment-level logging", "Operational alert integration"],
    requirement: "Requires the monitoring webhook environment variable and an external receiving service.",
  },
  {
    name: "Public REST API",
    category: "Developer platform",
    status: "planned",
    statusLabel: "Planned",
    summary: "A documented customer-facing API for approved business records is planned for a future platform phase.",
    capabilities: ["Scoped API access", "Documented resources", "Token and permission model"],
    requirement: "Not currently offered as a public production API.",
  },
  {
    name: "Business event webhooks",
    category: "Developer platform",
    status: "planned",
    statusLabel: "Planned",
    summary: "General outbound events for invoices, payments, inventory and customer records are planned.",
    capabilities: ["Signed event delivery", "Retry handling", "Subscription management"],
    requirement: "Not currently offered as a general customer webhook platform.",
  },
  {
    name: "Bank feeds",
    category: "Finance",
    status: "planned",
    statusLabel: "Planned",
    summary: "Direct institution feeds are a roadmap item and will depend on supported bank interfaces and commercial agreements.",
    capabilities: ["Statement ingestion", "Transaction matching", "Reconciliation assistance"],
    requirement: "No direct bank-feed availability is claimed today.",
  },
  {
    name: "Ecommerce connectors",
    category: "Commerce",
    status: "planned",
    statusLabel: "Planned",
    summary: "Connectors for online storefront orders, products and customer records are planned for a later integration phase.",
    capabilities: ["Order import", "Product synchronization", "Customer mapping"],
    requirement: "No ecommerce connector is presented as active today.",
  },
];
