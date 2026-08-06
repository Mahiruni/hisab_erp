import type { Language } from "./translations";

export const operationalModuleSlugs = [
  "purchasing-expenses",
  "inventory-warehouse",
  "customers-suppliers",
  "security-approvals-audit",
  "reports-analytics",
  "localization-compliance",
  "human-resources-payroll",
  "fixed-assets",
  "budgeting-projects",
  "integrations-automation",
] as const;

export type OperationalModuleSlug = (typeof operationalModuleSlugs)[number];

export type OperationalModuleDefinition = {
  slug: OperationalModuleSlug;
  phase: 1 | 2 | 3;
  recordTypes: readonly string[];
  statuses: readonly string[];
  companionHref?: string;
  companionLabel?: string;
};

export const operationalModuleDefinitions: Record<OperationalModuleSlug, OperationalModuleDefinition> = {
  "purchasing-expenses": {
    slug: "purchasing-expenses",
    phase: 1,
    recordTypes: ["purchase_request", "purchase_order", "supplier_bill", "expense_claim", "supplier_payment"],
    statuses: ["draft", "submitted", "approved", "ordered", "received", "paid", "rejected", "cancelled"],
  },
  "inventory-warehouse": {
    slug: "inventory-warehouse",
    phase: 1,
    recordTypes: ["stock_transfer", "stock_count", "stock_adjustment", "reorder_request", "batch_tracking"],
    statuses: ["draft", "planned", "in_progress", "completed", "reconciled", "cancelled"],
    companionHref: "/inventory",
    companionLabel: "Open product and stock catalogue",
  },
  "customers-suppliers": {
    slug: "customers-suppliers",
    phase: 1,
    recordTypes: ["customer_profile", "supplier_profile", "credit_review", "contact_update", "account_hold"],
    statuses: ["draft", "active", "under_review", "approved", "on_hold", "inactive", "closed"],
    companionHref: "/customers",
    companionLabel: "Open customer directory",
  },
  "security-approvals-audit": {
    slug: "security-approvals-audit",
    phase: 1,
    recordTypes: ["approval_request", "access_review", "security_incident", "audit_export", "policy_exception"],
    statuses: ["open", "pending", "approved", "rejected", "investigating", "resolved", "closed"],
  },
  "reports-analytics": {
    slug: "reports-analytics",
    phase: 1,
    recordTypes: ["saved_report", "scheduled_report", "data_export", "management_alert", "analytics_request"],
    statuses: ["draft", "active", "scheduled", "processed", "delivered", "failed", "closed"],
    companionHref: "/reports",
    companionLabel: "Open financial report export",
  },
  "localization-compliance": {
    slug: "localization-compliance",
    phase: 1,
    recordTypes: ["tax_rule", "document_rule", "currency_rate", "legal_field", "compliance_task"],
    statuses: ["draft", "under_review", "approved", "active", "expired", "replaced", "closed"],
  },
  "human-resources-payroll": {
    slug: "human-resources-payroll",
    phase: 2,
    recordTypes: ["employee_record", "leave_request", "payroll_run", "contract_change", "attendance_issue"],
    statuses: ["draft", "submitted", "approved", "active", "processed", "paid", "rejected", "closed"],
  },
  "fixed-assets": {
    slug: "fixed-assets",
    phase: 2,
    recordTypes: ["asset_registration", "maintenance_job", "asset_transfer", "asset_assignment", "asset_disposal"],
    statuses: ["draft", "active", "assigned", "maintenance", "transferred", "disposed", "closed"],
    companionHref: "/finance?tab=assets",
    companionLabel: "Open financial asset register",
  },
  "budgeting-projects": {
    slug: "budgeting-projects",
    phase: 2,
    recordTypes: ["department_budget", "project", "milestone", "cost_allocation", "variance_review"],
    statuses: ["draft", "submitted", "approved", "active", "at_risk", "completed", "closed"],
  },
  "integrations-automation": {
    slug: "integrations-automation",
    phase: 3,
    recordTypes: ["integration", "automation_workflow", "webhook", "data_import", "api_access"],
    statuses: ["draft", "testing", "active", "connected", "paused", "failed", "disabled"],
  },
};

export function isOperationalModuleSlug(value: string): value is OperationalModuleSlug {
  return operationalModuleSlugs.includes(value as OperationalModuleSlug);
}

const sharedCopy = {
  en: {
    overview: "Overview",
    records: "Records",
    create: "Create",
    controls: "Controls",
    total: "Total records",
    active: "Active work",
    completed: "Completed",
    atRisk: "Needs attention",
    value: "Tracked value",
    recentActivity: "Recent activity",
    latestRecords: "Latest records",
    newRecord: "Create a new record",
    type: "Record type",
    title: "Title",
    counterparty: "Customer, supplier or party",
    owner: "Owner or assignee",
    status: "Status",
    priority: "Priority",
    amount: "Amount (ETB)",
    dueDate: "Due date",
    description: "Notes and business context",
    save: "Save record",
    update: "Update",
    updateNote: "Update note",
    noRecords: "No records yet. Create the first operational record for this module.",
    noActivity: "Activity will appear here after records are created or updated.",
    features: "Business capabilities",
    governance: "Controls and governance",
    live: "Live workspace",
    demo: "Demo workspace",
    readOnly: "You have read-only access to this module.",
    phase: "Phase",
    priorityLabel: "Priority",
    operational: "Operational workspace",
    openCompanion: "Open connected workspace",
    low: "Low",
    normal: "Normal",
    high: "High",
    critical: "Critical",
  },
  am: {
    overview: "አጠቃላይ",
    records: "መዝገቦች",
    create: "አዲስ ፍጠር",
    controls: "ቁጥጥር",
    total: "ጠቅላላ መዝገቦች",
    active: "በስራ ላይ",
    completed: "የተጠናቀቁ",
    atRisk: "ትኩረት የሚፈልጉ",
    value: "የተመዘገበ ዋጋ",
    recentActivity: "የቅርብ እንቅስቃሴ",
    latestRecords: "የቅርብ መዝገቦች",
    newRecord: "አዲስ መዝገብ ፍጠር",
    type: "የመዝገብ ዓይነት",
    title: "ርዕስ",
    counterparty: "ደንበኛ፣ አቅራቢ ወይም ወገን",
    owner: "ኃላፊ ወይም ተመዳቢ",
    status: "ሁኔታ",
    priority: "ቅድሚያ",
    amount: "መጠን (ብር)",
    dueDate: "የማጠናቀቂያ ቀን",
    description: "ማስታወሻ እና የስራ ዝርዝር",
    save: "መዝገቡን አስቀምጥ",
    update: "አዘምን",
    updateNote: "የማዘመኛ ማስታወሻ",
    noRecords: "እስካሁን መዝገብ የለም። የመጀመሪያውን የስራ መዝገብ ይፍጠሩ።",
    noActivity: "መዝገብ ሲፈጠር ወይም ሲዘምን እንቅስቃሴው እዚህ ይታያል።",
    features: "የንግድ ችሎታዎች",
    governance: "ቁጥጥር እና አስተዳደር",
    live: "ቀጥታ የስራ ቦታ",
    demo: "የማሳያ የስራ ቦታ",
    readOnly: "በዚህ ሞጁል ላይ የማንበብ ፈቃድ ብቻ አለዎት።",
    phase: "ደረጃ",
    priorityLabel: "ቅድሚያ",
    operational: "የስራ ማዕከል",
    openCompanion: "የተገናኘውን የስራ ቦታ ክፈት",
    low: "ዝቅተኛ",
    normal: "መደበኛ",
    high: "ከፍተኛ",
    critical: "አስቸኳይ",
  },
  ti: {
    overview: "ሓፈሻዊ",
    records: "መዛግብቲ",
    create: "ሓድሽ ፍጠር",
    controls: "ቁጽጽር",
    total: "ጠቕላላ መዛግብቲ",
    active: "ኣብ ስራሕ",
    completed: "ዝተዛዘሙ",
    atRisk: "ትኹረት ዘድልዮም",
    value: "ዝተመዝገበ ዋጋ",
    recentActivity: "ቀረባ ንጥፈት",
    latestRecords: "ቀረባ መዛግብቲ",
    newRecord: "ሓድሽ መዝገብ ፍጠር",
    type: "ዓይነት መዝገብ",
    title: "ኣርእስቲ",
    counterparty: "ዓሚል፣ ኣቕራቢ ወይ ወገን",
    owner: "ሓላፊ ወይ ተመዳቢ",
    status: "ኩነታት",
    priority: "ቀዳምነት",
    amount: "መጠን (ብር)",
    dueDate: "መወዳእታ ዕለት",
    description: "መዘኻኸሪን ዝርዝር ስራሕን",
    save: "መዝገብ ዓቅብ",
    update: "ኣዐርይ",
    updateNote: "መዘኻኸሪ ምዕራይ",
    noRecords: "ክሳብ ሕጂ መዝገብ የለን። ናይ መጀመርታ መዝገብ ፍጠር።",
    noActivity: "መዝገብ ምስ ተፈጥረ ወይ ምስ ተዓረየ ንጥፈት ኣብዚ ይረአ።",
    features: "ክእለታት ንግዲ",
    governance: "ቁጽጽርን ምሕደራን",
    live: "ቀጥታ መስርሕ",
    demo: "ናይ ምርኢት መስርሕ",
    readOnly: "ኣብዚ ሞጁል ናይ ምንባብ ፍቓድ ጥራይ ኣለካ።",
    phase: "ደረጃ",
    priorityLabel: "ቀዳምነት",
    operational: "መስርሕ ስራሕ",
    openCompanion: "ዝተኣሳሰረ መስርሕ ክፈት",
    low: "ትሑት",
    normal: "ልሙድ",
    high: "ልዑል",
    critical: "ህጹጽ",
  },
} as const;

export function getOperationalCopy(language: Language) {
  return sharedCopy[language];
}

const labelOverrides: Record<Language, Record<string, string>> = {
  en: {},
  am: {
    purchase_request: "የግዥ ጥያቄ", purchase_order: "የግዥ ትዕዛዝ", supplier_bill: "የአቅራቢ ደረሰኝ", expense_claim: "የወጪ ጥያቄ", supplier_payment: "የአቅራቢ ክፍያ",
    stock_transfer: "የክምችት ዝውውር", stock_count: "የክምችት ቆጠራ", stock_adjustment: "የክምችት ማስተካከያ", reorder_request: "እንደገና የማዘዝ ጥያቄ", batch_tracking: "የባች ክትትል",
    customer_profile: "የደንበኛ መገለጫ", supplier_profile: "የአቅራቢ መገለጫ", credit_review: "የክሬዲት ግምገማ", contact_update: "የእውቂያ ማዘመኛ", account_hold: "የመለያ እገዳ",
    employee_record: "የሰራተኛ መዝገብ", leave_request: "የፈቃድ ጥያቄ", payroll_run: "የደመወዝ ሂደት", contract_change: "የውል ለውጥ", attendance_issue: "የመገኘት ጉዳይ",
    integration: "ውህደት", automation_workflow: "አውቶሜሽን ሂደት", webhook: "ዌብሁክ", data_import: "ዳታ ማስገባት", api_access: "API ፍቃድ",
  },
  ti: {
    purchase_request: "ሕቶ ዕድጊ", purchase_order: "ትእዛዝ ዕድጊ", supplier_bill: "ቢል ኣቕራቢ", expense_claim: "ሕቶ ወጻኢ", supplier_payment: "ክፍሊት ኣቕራቢ",
    stock_transfer: "ምስግጋር ክምችት", stock_count: "ቆጸራ ክምችት", stock_adjustment: "ምዕራይ ክምችት", reorder_request: "ዳግማይ ሕቶ ትእዛዝ", batch_tracking: "ክትትል ባች",
    customer_profile: "ፕሮፋይል ዓሚል", supplier_profile: "ፕሮፋይል ኣቕራቢ", credit_review: "ገምጋም ክሬዲት", contact_update: "ምዕራይ ርክብ", account_hold: "ምቁራጽ ኣካውንት",
    employee_record: "መዝገብ ሰራሕተኛ", leave_request: "ሕቶ ዕረፍቲ", payroll_run: "ሂደት ደሞዝ", contract_change: "ለውጢ ውዕል", attendance_issue: "ጉዳይ ምምጻእ",
    integration: "ውህደት", automation_workflow: "ኣውቶሜሽን ሂደት", webhook: "ዌብሁክ", data_import: "ምእታው ዳታ", api_access: "API ፍቓድ",
  },
};

export function humanizeOperationalValue(value: string, language: Language) {
  return labelOverrides[language][value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
