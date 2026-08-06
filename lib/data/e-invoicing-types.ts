export type EInvoiceProvider = "manual_portal" | "ministry_api" | "accredited_provider";
export type EInvoiceEnvironment = "sandbox" | "production";
export type EInvoiceSubmissionMode = "manual_clearance" | "clearance_api" | "offline_queue";
export type EInvoiceProfileStatus = "draft" | "review" | "ready" | "suspended";
export type EInvoiceDocumentStatus = "draft" | "queued" | "submitting" | "accepted" | "rejected" | "failed" | "cancel_pending" | "cancelled";

export type EInvoiceProfile = {
  id: string;
  provider: EInvoiceProvider;
  environment: EInvoiceEnvironment;
  submissionMode: EInvoiceSubmissionMode;
  status: EInvoiceProfileStatus;
  legalName: string;
  taxpayerTin: string;
  vatNumber: string | null;
  commercialRegistrationNumber: string | null;
  providerAccountReference: string | null;
  certificateAlias: string | null;
  notes: string | null;
  lastVerifiedAt: string | null;
};

export type EInvoiceEvent = {
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  details: Record<string, unknown>;
  occurredAt: string;
};

export type EInvoiceDocument = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerTin: string | null;
  total: number;
  status: EInvoiceDocumentStatus;
  provider: EInvoiceProvider;
  environment: EInvoiceEnvironment;
  submissionMode: EInvoiceSubmissionMode;
  officialInvoiceId: string | null;
  officialReceiptId: string | null;
  verificationUrl: string | null;
  qrPayload: string | null;
  payloadHash: string | null;
  attemptCount: number;
  offlineQueued: boolean;
  queuedAt: string | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancellationRequestedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  cancellationReference: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  lastEvent: EInvoiceEvent | null;
};

export type EInvoiceSnapshot = {
  mode: "demo" | "live";
  organizationName: string;
  profile: EInvoiceProfile | null;
  metrics: {
    draft: number;
    queued: number;
    accepted: number;
    rejected: number;
    cancelPending: number;
    cancelled: number;
  };
  documents: EInvoiceDocument[];
};
