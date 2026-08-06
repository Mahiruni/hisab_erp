export type SetupStepKey = "company" | "branches" | "contacts" | "products" | "taxes" | "opening" | "invoice" | "security";

export type OnboardingSnapshot = {
  organization: {
    id: string;
    name: string;
    industry: string | null;
    country_code: string;
    base_currency: string;
    timezone: string;
    tin: string | null;
    vat_number: string | null;
    phone: string | null;
  };
  progress: {
    completed: number;
    total: number;
    percent: number;
    steps: Array<{ key: SetupStepKey; complete: boolean }>;
  };
  counts: {
    branches: number;
    customers: number;
    suppliers: number;
    products: number;
    openingStock: number;
    taxCodes: number;
    openingBalances: number;
    invoices: number;
  };
  branches: Array<{ id: string; name: string; code: string }>;
  warehouses: Array<{ id: string; name: string; code: string }>;
  accounts: Array<{ id: string; code: string; name: string; type: string }>;
};

export type ProductionControlSnapshot = {
  settings: {
    organization_id: string;
    login_alerts_enabled: boolean;
    financial_alerts_enabled: boolean;
    audit_export_enabled: boolean;
    backup_mode: "logical_daily" | "managed_daily" | "pitr";
    backup_retention_days: number;
    pitr_enabled: boolean;
    last_backup_at: string | null;
    last_backup_checksum: string | null;
    last_backup_reference: string | null;
    last_restore_test_at: string | null;
    restore_test_status: "passed" | "failed" | null;
    restore_test_notes: string | null;
  };
  mfa: { requiredAdmins: number; verifiedAdmins: number };
  alerts: Array<{
    id: string;
    category: string;
    severity: "info" | "warning" | "critical";
    title: string;
    description: string | null;
    status: "open" | "acknowledged";
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  health: null | {
    id: string;
    status: "healthy" | "warning" | "critical";
    checks: Record<string, unknown>;
    created_at: string;
  };
  auditCounts: { business: number; authentication: number };
  monitoringConfigured: boolean;
  projectPlan: "free";
};
