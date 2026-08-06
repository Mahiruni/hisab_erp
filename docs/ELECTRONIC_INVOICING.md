# Electronic Invoicing

Hisab ERP includes a provider-neutral electronic-invoicing foundation for Ethiopian clearance workflows. It does **not** claim government accreditation and does not invent Ministry of Revenue endpoints, credentials, certificates, invoice identifiers or QR values.

## Operating modes

- `manual_clearance`: prepare an immutable payload in Hisab, submit through the approved external portal, then record the official response and evidence.
- `clearance_api`: reserved for a documented direct government API contract.
- `offline_queue`: preserves payloads and retry timing for connectivity interruptions; a connected provider adapter is still required for transmission.

The issuer profile can use `manual_portal`, `ministry_api` or `accredited_provider`. API modes must remain in sandbox or draft/review status until HisabTech receives approved technical documentation and credentials.

## Data model

- `e_invoice_profiles`: organization-level taxpayer identity, provider choice, environment and readiness approval.
- `e_invoice_documents`: one compliance record per posted sales invoice, including provider status, immutable payload snapshot, SHA-256 payload hash, official identifiers, QR payload, signature references, retry state and cancellation evidence.
- `e_invoice_events`: append-only lifecycle history.

All tables use organization-scoped RLS. Signed-in users can read records for their organization, but direct client inserts, updates and deletes are revoked. Mutations run through role-checked RPC functions.

## Permissions

- Owner/admin with AAL2: configure and approve the issuer profile.
- Owner/admin/accountant/sales: prepare or retry an invoice payload.
- Owner/admin/accountant: record clearance, rejection and cancellation evidence.

Database functions independently validate `auth.uid()`, organization membership and allowed roles.

## Invoice lifecycle

1. Posting a sales invoice automatically creates an electronic-invoice document.
2. A ready profile can auto-queue new invoices; otherwise the document remains draft.
3. Queueing composes a canonical `hisab.einvoice.v1` JSON payload and stores its SHA-256 hash.
4. Manual or connected provider responses move the document to accepted, rejected or failed.
5. Accepted documents preserve official invoice/receipt identifiers, QR content, verification URL, digital-signature reference and response evidence.
6. Cancellation uses a two-step request and official-confirmation workflow.

Posted accounting, VAT, stock and receivable records are not rewritten by electronic-invoice status changes. The compliance adapter attaches evidence to the existing atomic invoice posting flow.

## Secrets and certificates

Never store private keys, API secrets or raw certificate files in browser forms, GitHub or public environment variables. Future provider adapters must use server-only Vercel/Supabase secrets and short-lived access tokens where supported.

## Before production API activation

Obtain and verify:

- approved provider or Ministry endpoint documentation
- sandbox and production base URLs
- authentication and token-rotation rules
- certificate format, custody and signing requirements
- required payload schema and field validation
- idempotency, retry and rate-limit rules
- callback/webhook authentication
- official cancellation and credit-note requirements
- provider accreditation and commercial agreement
- professional Ethiopian tax/legal review

Until those are available, use manual clearance and record only official values received from the approved external system.
