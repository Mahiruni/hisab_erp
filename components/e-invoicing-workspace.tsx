"use client";

import { useMemo, useState } from "react";
import {
  queueEInvoiceDocument,
  recordEInvoiceCancellation,
  recordEInvoiceClearance,
  recordEInvoiceRejection,
  requestEInvoiceCancellation,
  saveEInvoiceProfile,
} from "../lib/actions/e-invoicing";
import type { EInvoiceDocument, EInvoiceDocumentStatus, EInvoiceSnapshot } from "../lib/data/e-invoicing-types";
import { DemoNotice } from "./demo-notice";

const filters = [
  ["all", "All documents"],
  ["draft", "Needs preparation"],
  ["queued", "Awaiting clearance"],
  ["accepted", "Government cleared"],
  ["rejected", "Needs correction"],
  ["cancel_pending", "Cancellation pending"],
  ["cancelled", "Cancelled"],
] as const;

type Filter = (typeof filters)[number][0];

function money(value: number) {
  return new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 2 }).format(value || 0);
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function dateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-ET", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" }).format(new Date(value));
}

function matchesFilter(status: EInvoiceDocumentStatus, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "draft") return status === "draft";
  if (filter === "queued") return status === "queued" || status === "submitting";
  if (filter === "rejected") return status === "rejected" || status === "failed";
  return status === filter;
}

function ProfilePanel({ snapshot, canConfigure }: { snapshot: EInvoiceSnapshot; canConfigure: boolean }) {
  const profile = snapshot.profile;
  return (
    <section className="einvoice-panel einvoice-profile-panel">
      <div className="einvoice-panel-head">
        <div><p className="eyebrow">Issuer configuration</p><h2>Electronic-invoice profile</h2></div>
        <span className={`einvoice-status ${profile?.status || "draft"}`}>{profile ? label(profile.status) : "not configured"}</span>
      </div>
      <p className="einvoice-panel-intro">Store taxpayer identity and the approved submission method. Secret keys and certificate files never belong in this form.</p>
      <form action={saveEInvoiceProfile} className="einvoice-form">
        <label>Legal business name<input name="legalName" required maxLength={200} defaultValue={profile?.legalName || snapshot.organizationName} disabled={!canConfigure} /></label>
        <label>Taxpayer TIN<input name="taxpayerTin" required minLength={6} maxLength={80} defaultValue={profile?.taxpayerTin || ""} disabled={!canConfigure} /></label>
        <label>VAT number<input name="vatNumber" maxLength={80} defaultValue={profile?.vatNumber || ""} disabled={!canConfigure} /></label>
        <label>Commercial registration<input name="commercialRegistrationNumber" maxLength={120} defaultValue={profile?.commercialRegistrationNumber || ""} disabled={!canConfigure} /></label>
        <label>Provider<select name="provider" defaultValue={profile?.provider || "manual_portal"} disabled={!canConfigure}><option value="manual_portal">Manual government portal</option><option value="ministry_api">Direct ministry API</option><option value="accredited_provider">Accredited service provider</option></select></label>
        <label>Environment<select name="environment" defaultValue={profile?.environment || "sandbox"} disabled={!canConfigure}><option value="sandbox">Sandbox</option><option value="production">Production</option></select></label>
        <label>Submission method<select name="submissionMode" defaultValue={profile?.submissionMode || "manual_clearance"} disabled={!canConfigure}><option value="manual_clearance">Manual clearance</option><option value="clearance_api">Clearance API</option><option value="offline_queue">Offline queue</option></select></label>
        <label>Readiness status<select name="status" defaultValue={profile?.status || "draft"} disabled={!canConfigure}><option value="draft">Draft</option><option value="review">Under review</option><option value="ready">Approved and ready</option><option value="suspended">Suspended</option></select></label>
        <label>Provider account reference<input name="providerAccountReference" maxLength={160} defaultValue={profile?.providerAccountReference || ""} placeholder="Assigned after provider onboarding" disabled={!canConfigure} /></label>
        <label>Certificate alias<input name="certificateAlias" maxLength={160} defaultValue={profile?.certificateAlias || ""} placeholder="Reference only, never the private key" disabled={!canConfigure} /></label>
        <label className="full">Implementation notes<textarea name="notes" maxLength={1000} defaultValue={profile?.notes || ""} placeholder="Approval evidence, sandbox notes or provider contact" disabled={!canConfigure} /></label>
        <button className="primary full" disabled={!canConfigure}>Save electronic-invoice profile</button>
      </form>
      {!canConfigure && <small className="einvoice-readonly">Only an MFA-verified owner or administrator can change issuer configuration.</small>}
    </section>
  );
}

function QueueActions({ document, canQueue }: { document: EInvoiceDocument; canQueue: boolean }) {
  if (!["draft", "rejected", "failed"].includes(document.status)) return null;
  return (
    <div className="einvoice-action-row">
      <form action={queueEInvoiceDocument}><input type="hidden" name="documentId" value={document.id} /><input type="hidden" name="offline" value="false" /><button disabled={!canQueue}>Prepare clearance</button></form>
      <form action={queueEInvoiceDocument}><input type="hidden" name="documentId" value={document.id} /><input type="hidden" name="offline" value="true" /><button className="secondary" disabled={!canQueue}>Queue offline</button></form>
    </div>
  );
}

function ClearanceActions({ document, canClear }: { document: EInvoiceDocument; canClear: boolean }) {
  if (!["queued", "submitting", "rejected", "failed"].includes(document.status)) return null;
  return (
    <details className="einvoice-action-details">
      <summary>Record government response</summary>
      <div className="einvoice-response-grid">
        <form action={recordEInvoiceClearance} className="einvoice-response-form">
          <input type="hidden" name="documentId" value={document.id} />
          <h4>Clearance accepted</h4>
          <label>Official invoice ID<input name="officialInvoiceId" required maxLength={200} disabled={!canClear} /></label>
          <label>Official receipt ID<input name="officialReceiptId" maxLength={200} disabled={!canClear} /></label>
          <label>Official QR payload<textarea name="qrPayload" required maxLength={10_000} disabled={!canClear} /></label>
          <label>Verification URL<input name="verificationUrl" type="url" maxLength={2_000} disabled={!canClear} /></label>
          <label>Certificate serial<input name="certificateSerial" maxLength={500} disabled={!canClear} /></label>
          <label>Digital signature<textarea name="digitalSignature" maxLength={20_000} disabled={!canClear} /></label>
          <label>Provider request ID<input name="providerRequestId" maxLength={500} disabled={!canClear} /></label>
          <label>Provider response ID<input name="providerResponseId" maxLength={500} disabled={!canClear} /></label>
          <label className="full">Response evidence JSON<textarea name="responseSnapshot" maxLength={50_000} placeholder='{"status":"accepted"}' disabled={!canClear} /></label>
          <button className="primary full" disabled={!canClear}>Record official clearance</button>
        </form>
        <form action={recordEInvoiceRejection} className="einvoice-response-form rejection">
          <input type="hidden" name="documentId" value={document.id} />
          <h4>Clearance rejected</h4>
          <label>Error code<input name="errorCode" maxLength={200} disabled={!canClear} /></label>
          <label>Provider response ID<input name="providerResponseId" maxLength={500} disabled={!canClear} /></label>
          <label className="full">Rejection reason<textarea name="errorMessage" required maxLength={2_000} disabled={!canClear} /></label>
          <label className="full">Response evidence JSON<textarea name="responseSnapshot" maxLength={50_000} placeholder='{"status":"rejected"}' disabled={!canClear} /></label>
          <button className="danger full" disabled={!canClear}>Record rejection</button>
        </form>
      </div>
    </details>
  );
}

function CancellationActions({ document, canClear }: { document: EInvoiceDocument; canClear: boolean }) {
  if (document.status === "accepted") {
    return (
      <details className="einvoice-action-details">
        <summary>Request cancellation</summary>
        <form action={requestEInvoiceCancellation} className="einvoice-compact-form">
          <input type="hidden" name="documentId" value={document.id} />
          <label>Cancellation reason<textarea name="reason" required minLength={5} maxLength={1000} disabled={!canClear} /></label>
          <button className="danger" disabled={!canClear}>Record cancellation request</button>
        </form>
      </details>
    );
  }
  if (document.status === "cancel_pending") {
    return (
      <details className="einvoice-action-details" open>
        <summary>Complete official cancellation</summary>
        <form action={recordEInvoiceCancellation} className="einvoice-compact-form">
          <input type="hidden" name="documentId" value={document.id} />
          <label>Official cancellation reference<input name="cancellationReference" required maxLength={500} disabled={!canClear} /></label>
          <label>Response evidence JSON<textarea name="responseSnapshot" maxLength={50_000} placeholder='{"status":"cancelled"}' disabled={!canClear} /></label>
          <button className="danger" disabled={!canClear}>Confirm official cancellation</button>
        </form>
      </details>
    );
  }
  return null;
}

function DocumentCard({ document, canQueue, canClear }: { document: EInvoiceDocument; canQueue: boolean; canClear: boolean }) {
  return (
    <article className="einvoice-document-card">
      <header>
        <div><strong>{document.invoiceNumber}</strong><small>{document.invoiceDate} · {document.customerName}</small></div>
        <span className={`einvoice-status ${document.status}`}>{label(document.status)}</span>
      </header>
      <div className="einvoice-document-summary">
        <span>Invoice total<strong>{money(document.total)}</strong></span>
        <span>Buyer TIN<strong>{document.customerTin || "Not supplied"}</strong></span>
        <span>Provider<strong>{label(document.provider)}</strong></span>
        <span>Attempts<strong>{document.attemptCount}</strong></span>
      </div>
      <div className="einvoice-evidence">
        <span>Official invoice ID<strong>{document.officialInvoiceId || "Pending"}</strong></span>
        <span>Payload hash<code>{document.payloadHash ? document.payloadHash.slice(0, 18) : "Not generated"}</code></span>
        <span>Last event<strong>{document.lastEvent ? label(document.lastEvent.type) : "No lifecycle event"}</strong></span>
        <span>Updated<strong>{dateTime(document.lastEvent?.occurredAt || document.acceptedAt || document.queuedAt)}</strong></span>
      </div>
      {document.lastErrorMessage && <div className="einvoice-error"><strong>{document.lastErrorCode || "Provider rejection"}</strong><span>{document.lastErrorMessage}</span></div>}
      {document.verificationUrl && <a className="einvoice-verify-link" href={document.verificationUrl} target="_blank" rel="noopener noreferrer">Open official verification ↗</a>}
      {document.cancellationReason && <p className="einvoice-cancellation-note"><strong>Cancellation reason:</strong> {document.cancellationReason}</p>}
      <QueueActions document={document} canQueue={canQueue} />
      <ClearanceActions document={document} canClear={canClear} />
      <CancellationActions document={document} canClear={canClear} />
    </article>
  );
}

export function EInvoicingWorkspace({
  snapshot,
  success,
  canConfigure,
  canQueue,
  canClear,
}: {
  snapshot: EInvoiceSnapshot;
  success?: string;
  canConfigure: boolean;
  canQueue: boolean;
  canClear: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const documents = useMemo(() => snapshot.documents.filter((document) => matchesFilter(document.status, filter)), [snapshot.documents, filter]);
  const profileReady = snapshot.profile?.status === "ready";

  return (
    <main className="einvoice-page">
      <header className="einvoice-hero">
        <div><p className="eyebrow">Ethiopian compliance adapter</p><h1>Electronic Invoicing</h1><p>Prepare immutable invoice payloads, record government clearance evidence and preserve every lifecycle event without inventing provider credentials.</p></div>
        <div className="einvoice-hero-state"><span className={profileReady ? "ready" : "pending"} /><div><small>Clearance readiness</small><strong>{profileReady ? "Profile ready" : "Configuration required"}</strong></div></div>
      </header>

      <DemoNotice mode={snapshot.mode} />
      {success && <div className="form-alert success einvoice-success">{success}</div>}
      <section className="einvoice-notice">
        <strong>Provider-neutral foundation</strong>
        <p>Manual clearance works now. Direct ministry or accredited-provider submission remains disabled until HisabTech receives approved endpoint documentation, credentials and certificate requirements.</p>
      </section>

      <section className="einvoice-kpis">
        <article><span>Needs preparation</span><strong>{snapshot.metrics.draft}</strong><small>Profile or payload action required</small></article>
        <article><span>Awaiting clearance</span><strong>{snapshot.metrics.queued}</strong><small>Online or offline submission queue</small></article>
        <article><span>Government cleared</span><strong>{snapshot.metrics.accepted}</strong><small>Official identifiers preserved</small></article>
        <article><span>Needs correction</span><strong>{snapshot.metrics.rejected}</strong><small>Rejected or failed documents</small></article>
        <article><span>Cancellation pending</span><strong>{snapshot.metrics.cancelPending}</strong><small>Waiting for official response</small></article>
        <article><span>Cancelled</span><strong>{snapshot.metrics.cancelled}</strong><small>Official cancellation evidence</small></article>
      </section>

      <div className="einvoice-layout">
        <ProfilePanel snapshot={snapshot} canConfigure={canConfigure} />
        <section className="einvoice-panel einvoice-register-panel">
          <div className="einvoice-panel-head">
            <div><p className="eyebrow">Clearance lifecycle</p><h2>Electronic-invoice register</h2></div>
            <span>{snapshot.documents.length} documents</span>
          </div>
          <div className="einvoice-filters" role="group" aria-label="Filter electronic invoices">
            {filters.map(([key, text]) => <button type="button" className={filter === key ? "active" : ""} key={key} onClick={() => setFilter(key)}>{text}</button>)}
          </div>
          <div className="einvoice-document-list">
            {documents.length
              ? documents.map((document) => <DocumentCard document={document} canQueue={canQueue} canClear={canClear} key={document.id} />)
              : <div className="einvoice-empty">No electronic invoices match this filter.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
