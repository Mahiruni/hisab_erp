export type ReconciliationSourceType = "bank" | "telebirr" | "mpesa";
export type ReconciliationProvider = "manual_csv" | "bank_statement" | "telebirr" | "safaricom_daraja";
export type ReconciliationStatus = "unmatched" | "suggested" | "partially_matched" | "matched" | "ignored" | "duplicate" | "disputed";
export type ReconciliationTargetType = "sales_invoice" | "supplier_bill" | "account" | "suspense";

export type ReconciliationAccount = {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype: string | null;
  currency: string;
};

export type ReconciliationSource = {
  id: string;
  branchId: string | null;
  sourceType: ReconciliationSourceType;
  provider: ReconciliationProvider;
  name: string;
  bankAccountId: string | null;
  ledgerAccountId: string;
  ledgerAccountName: string;
  feeAccountId: string | null;
  feeAccountName: string | null;
  withholdingAccountId: string | null;
  withholdingAccountName: string | null;
  suspenseAccountId: string;
  suspenseAccountName: string;
  currency: string;
  environment: "sandbox" | "production";
  status: "draft" | "ready" | "suspended";
  externalAccountReference: string | null;
  merchantReference: string | null;
  autoMatch: boolean;
  amountTolerance: number;
  dateToleranceDays: number;
  notes: string | null;
  transactionCount: number;
  unmatchedCount: number;
};

export type ReconciliationMatch = {
  id: string;
  targetType: ReconciliationTargetType;
  targetId: string | null;
  cashAmount: number;
  allocationAmount: number;
  feeAmount: number;
  withholdingAmount: number;
  status: "proposed" | "confirmed" | "reversed";
  matchReason: string | null;
  journalEntryId: string | null;
  paymentId: string | null;
  confirmedAt: string | null;
  reversedAt: string | null;
};

export type ReconciliationTransaction = {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: ReconciliationSourceType;
  provider: ReconciliationProvider;
  sourceChannel: "csv" | "callback" | "api" | "manual";
  direction: "credit" | "debit";
  transactionDate: string;
  transactionTime: string | null;
  valueDate: string | null;
  providerTransactionId: string | null;
  providerOrderId: string | null;
  statementReference: string | null;
  counterpartyName: string | null;
  counterpartyPhone: string | null;
  counterpartyAccountMasked: string | null;
  narrative: string | null;
  currency: string;
  cashAmount: number;
  feeAmount: number;
  withholdingAmount: number;
  matchedCashAmount: number;
  remainingCashAmount: number;
  status: ReconciliationStatus;
  suggestedTargetType: ReconciliationTargetType | null;
  suggestedTargetId: string | null;
  suggestedTargetLabel: string | null;
  suggestionConfidence: number | null;
  suggestionReason: string | null;
  lastEvent: { type: string; details: Record<string, unknown>; occurredAt: string } | null;
  matches: ReconciliationMatch[];
};

export type ReconciliationBatch = {
  id: string;
  sourceId: string;
  sourceName: string;
  batchType: string;
  filename: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  status: string;
  rowCount: number;
  importedCount: number;
  duplicateCount: number;
  totalCredit: number;
  totalDebit: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type ReconciliationSnapshot = {
  mode: "live" | "demo";
  organizationName: string;
  metrics: {
    unmatched: number;
    suggested: number;
    partiallyMatched: number;
    matched: number;
    disputed: number;
    unreconciledCredits: number;
    unreconciledDebits: number;
  };
  sources: ReconciliationSource[];
  transactions: ReconciliationTransaction[];
  batches: ReconciliationBatch[];
  providerEvents: Array<{
    id: number;
    sourceId: string;
    sourceName: string;
    provider: string;
    providerEventId: string;
    status: string;
    signatureValid: boolean | null;
    transactionId: string | null;
    errorMessage: string | null;
    receivedAt: string;
    processedAt: string | null;
  }>;
  accounts: ReconciliationAccount[];
  bankAccounts: Array<{ id: string; accountId: string; name: string; bankName: string | null; accountNumberMasked: string | null; currency: string }>;
  branches: Array<{ id: string; code: string; name: string }>;
  openInvoices: Array<{ id: string; number: string; date: string; dueDate: string; customerId: string; customerName: string; customerPhone: string | null; customerReference: string | null; currency: string; outstanding: number }>;
  openSupplierBills: Array<{ id: string; number: string; supplierInvoiceNumber: string | null; date: string; dueDate: string; supplierId: string; supplierName: string; outstanding: number }>;
};
