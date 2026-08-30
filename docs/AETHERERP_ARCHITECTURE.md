# AetherERP production architecture

> **Brand:** AetherERP  
> **Tagline:** One operating system for the entire company.  
> **Product principle:** one ledger, one truth, one command center.

This document is the implementation blueprint for converting the authenticated ERP archive into AetherERP without losing source behavior. The existing Next.js/Supabase application is retained as the executable baseline because the archive itself was generated from this repository and its active schema.

---

# 1. Executive summary

AetherERP is a modular, organization-scoped ERP for Ethiopian and multi-entity businesses. The existing production code already covers the authenticated route register, double-entry finance, quote-to-cash, procure-to-pay, inventory control, HR/payroll, bank/mobile-money reconciliation, electronic-invoice evidence, onboarding, account security and production controls represented in the source archive.

The architecture is therefore an **in-place enterprise rebrand and hardening**, not a destructive rewrite. Business logic and database contracts are preserved; the presentation layer is replaced with the AetherERP brand system and customer-facing naming. This approach gives the strongest possible source fidelity and avoids migration risk in accounting and audit data.

AetherERP remains multi-tenant by organization, uses PostgreSQL row-level security as a data boundary, and routes mutations through controlled server/RPC workflows where accounting, inventory and privileged actions need validation, authorization and audit evidence.

---

# 2. Brand application summary

## Brand contract

- **Void:** `#07090C` - application canvas
- **Ink:** `#0C1117` - major sections and navigation
- **Raised:** `#121821` - cards, tables, modals and form surfaces
- **Hairline:** `rgba(214,228,240,0.10)`
- **Paper:** `#E8EEF4` - primary text
- **Mute:** `#8B9BB0` - secondary text
- **Accent:** `#3EE0C4` - focus, selection, active states, primary action
- **Gold:** `#D4B483` - rare enterprise/financial emphasis
- **Danger:** `#E26D6D`
- **Success:** `#3DDC97`

## Typography

- Display: **Cormorant Garamond**, 400/500/600, H1/H2 and editorial product moments only.
- UI/body: **Sora**, 400/500/600/700.
- Financial/technical numbers: **IBM Plex Mono**, tabular numerals.
- Existing legacy font CSS variables are aliased to the AetherERP variables so old component styles do not break during the migration.

## Application surfaces

The brand authority is `app/aether-brand.css`, loaded last from the root layout. It governs:

- authenticated sidebar and mobile shell;
- login/authentication surfaces;
- cards, forms, tables and data grids;
- focus rings, selection, status colors and button hierarchy;
- report print presentation;
- reduced-motion behavior;
- loading states;
- mobile navigation.

The logo is `public/aether-logo.svg`. The same geometric A monogram and palette are intended for browser icons, PWA metadata, report headers and email chrome.

## Tone

System language is calm and operational. Error and help copy should state: what happened, which rule stopped the action, and the next permitted action. Decorative hype is excluded.

---

# 3. System architecture and module design

## Runtime architecture

```text
Browser / PWA
  |
  | HTTPS
  v
Next.js App Router
  |-- Server Components
  |-- Server Actions
  |-- API routes / provider callbacks
  |-- Auth/session/MFA gates
  |
  v
Supabase
  |-- PostgreSQL
  |-- Row Level Security
  |-- SQL workflow functions / triggers
  |-- Supabase Auth
  |
  +--> audit_events / auth_audit_events / security_alerts
  +--> external provider adapters
```

## Tenancy model

`organizations` is the tenant root. Organization-owned tables carry `organization_id`; access is constrained by membership and RLS. `organization_members` binds authenticated users to organizations and roles, while optional branch assignment scopes operating context.

Business documents, stock movements, journals, payroll, security events and provider reconciliation events remain organization-scoped. Cross-tenant access is not an application convention; it is prevented in PostgreSQL.

## Module boundaries

### Financial Management

Routes: `/finance`, `/finance/journals`

Responsibilities:
- chart of accounts;
- double-entry journal creation/posting/reversal;
- AR/AP financial position;
- cash and bank ledgers;
- payments and expenses;
- tax codes and effective dates;
- accounting periods and locking;
- fixed assets and depreciation;
- P&L, balance sheet, cash-flow and trial-balance views.

Core rules:
- every posted journal balances;
- a journal line may carry debit or credit, not both;
- posted/reversed journals are immutable;
- locked periods reject new/changed entries;
- finance mutations are role-gated;
- financial actions emit audit evidence.

### Sales & Distribution / CRM

Routes: `/sales`, `/sales/invoices/new`, `/customers`

Flow:
`Quotation -> Sales order -> Invoice -> Receipt`, with returns/credit effects and customer balances.

Invoices are the accounting/stock boundary: posting creates receivable, revenue, VAT, inventory/COGS effects as one controlled workflow where applicable. Commercial quotation/order states remain separate from financial posting.

### Purchasing / Accounts Payable

Route: `/purchasing`

Flow:
`Request -> Supplier quote -> Purchase order -> Goods receipt -> Supplier bill -> Payment`, plus purchase returns.

Controls include approval/rejection, supplier master/TIN/terms/credit, budget-control extension points, duplicate-document controls, receiving evidence and separation of duties.

### Inventory & Warehouse

Route: `/inventory`

Responsibilities:
- product/SKU master;
- warehouse balances;
- receipts/issues;
- transfers;
- physical counts and reconciliation;
- controlled adjustments;
- reorder thresholds;
- batch/lot, expiry and serial tracking;
- inventory valuation inputs.

Negative-stock prevention and movement auditability remain database-level concerns, not only UI rules.

### Human Resources & Payroll

Route: `/hr`

Responsibilities:
- employee master;
- employment class and organization structure;
- attendance;
- leave requests and decisions;
- salary structures;
- payroll calculation;
- approval, accounting posting and payment confirmation.

Statutory rates remain configurable. The product must not present a payroll run as filing-ready solely because it calculated successfully.

### Electronic Invoicing

Route: `/e-invoicing`

The current architecture deliberately separates:
1. immutable invoice payload preparation;
2. provider submission method;
3. clearance evidence;
4. rejection/correction;
5. cancellation request/completion;
6. lifecycle event audit history.

Direct ministry/accredited-provider submission remains disabled until approved endpoint documentation, credentials and certificate requirements are available. Secrets/private keys must not be entered into ordinary profile forms.

### Reconciliation

Route: `/reconciliation`

Supported source families in the archive:
- bank account statement;
- Telebirr merchant;
- Safaricom M-Pesa / Daraja.

Ingestion normalizes and hashes imported files/transactions to detect duplicates. Matching supports invoices, supplier bills, ledger accounts and suspense, including fee and withholding components. Reversal and dispute actions require reasons and evidence.

### Reports & Analytics

Route: `/reports`

The management dashboard can export a current KPI snapshot and recent activity. A dashboard operating result is explicitly not a substitute for a finalized financial statement until journals and period completeness have been confirmed.

### Security, Approvals & Audit

Routes: `/account`, `/security`

Controls represented in source:
- role-based access;
- AAL2/MFA gate for privileged actions;
- login/session history;
- leaked-password protection;
- material-action alerts;
- immutable business/auth audit streams;
- backup evidence;
- restore-test evidence;
- PITR capability gating;
- scheduled database health checks;
- spreadsheet-safe audit export.

### Company launch

Route: `/onboarding`

Eight retained milestones:
1. Company profile
2. Branches & warehouses
3. Customers & suppliers
4. Products & opening stock
5. Taxes & accounts
6. Opening balances
7. First invoice
8. Administrator security

---

# 4. Detailed data model

The exact executable schema is the migration set under `supabase/migrations/`. The following is the principal relational contract.

## Organization and access

### organizations
- `id uuid PK default gen_random_uuid()`
- `name text NOT NULL`, 2-160 chars
- `tin text NULL`
- `vat_number text NULL`
- `phone text NULL`
- `base_currency char(3) NOT NULL default ETB`
- `timezone text NOT NULL default Africa/Addis_Ababa`
- `created_by uuid -> auth.users`
- `created_at timestamptz`
- `updated_at timestamptz`

### branches
- organization FK with cascade delete
- branch name/code/address
- active flag
- unique `(organization_id, code)`

### organization_members
- organization/user FKs
- optional branch FK
- full name
- role enum
- active flag
- unique `(organization_id, user_id)`

### document_counters
- composite PK `(organization_id, prefix)`
- monotonic `bigint current_value >= 0`

## Master data

### customers
- organization + optional branch
- name/email/phone/TIN
- `credit_limit numeric(18,2) >= 0`
- `payment_terms_days integer 0..3650`
- active/creator/timestamps
- organization-scoped unique TIN when TIN exists

### products
- organization
- SKU/name/unit
- `unit_price numeric(18,2) >= 0`
- `cost_price numeric(18,2) >= 0`
- `reorder_level numeric(18,3) >= 0`
- active/creator/timestamps
- unique `(organization_id, sku)`

### warehouses
- organization + optional branch
- name/code/active
- unique `(organization_id, code)`

## Finance

### accounts
- organization
- code/name
- account type: asset/liability/equity/revenue/expense
- normal side: debit/credit
- subtype
- currency char(3)
- `allow_manual_posting`
- system/active flags
- unique `(organization_id, code)`

### journal_entries
- organization + optional branch
- unique organization-scoped entry number
- entry date/memo/status
- source type/source ID
- created/posted actors and timestamp

### journal_lines
- journal/account FKs
- description
- `debit numeric(18,2) >= 0`
- `credit numeric(18,2) >= 0`
- constraint requires exactly one positive side

### accounting_periods
- start/end dates
- state: open/soft_closed/locked
- lock actor/timestamp
- no inverted date range

### tax_codes
- code/name
- `rate numeric(7,4)` between 0 and 100
- type: output/input/withholding/exempt
- account mapping
- active flag
- effective_from/effective_to
- effective date integrity check

### bank_accounts
- account-ledger FK
- name/bank/masked number/currency
- active and creator

### fixed_assets
- asset number/name/category
- acquisition and in-service dates
- cost/salvage/useful life
- straight-line depreciation method
- accumulated depreciation
- status
- asset, accumulated depreciation and depreciation expense account mappings
- acquisition journal reference
- checks prevent salvage >= cost and over-depreciation

### asset_depreciation_runs
- asset/period/depreciation date/amount
- journal entry reference
- unique run per asset-period

## Sales

### sales_invoices
- organization/branch/customer
- invoice number/date/due date/status
- subtotal/tax/total/paid
- total generated from subtotal + tax
- paid amount cannot exceed invoice total
- notes/journal/creator/timestamps

### sales_invoice_items
- invoice/product/warehouse
- description/quantity/unit price/tax rate
- line subtotal/tax/cost total
- quantity > 0 and monetary values non-negative

Additional quotation/order/return header and item tables preserve commercial lifecycle separately from posted invoices.

## Stock

### stock_balances
- composite PK organization/product/warehouse
- `quantity numeric(18,3) >= 0`

### stock_movements
- product/warehouse
- movement enum: opening/purchase/sale/adjustment_in/adjustment_out/transfer_in/transfer_out/return_in/return_out
- quantity > 0
- source/reference/actor/occurred timestamp

Transfers, counts, adjustments, lots and serials use dedicated header/item or tracking tables to keep movements attributable.

## Security and workflow

### approval_requests
- organization/entity type/entity ID
- state pending/approved/rejected/cancelled
- requester/decision actor/note/timestamps

### audit_events
- identity PK
- organization + actor
- action/entity/entity ID
- JSONB metadata
- immutable occurred timestamp

Auth audit, sessions, login attempts, recovery, alerts and database health are separate tables so security evidence is not mixed with business activity.

---

# 5. Ethiopia localization specification

## Source-backed behavior already present

- ETB base currency support and multi-currency-ready three-character currency fields.
- Default timezone `Africa/Addis_Ababa`.
- TIN and VAT identity fields.
- VAT/tax code engine with effective dates.
- English and Amharic application copy.
- Source-level Tigrinya operational copy.
- Telebirr and M-Pesa reconciliation adapters/source models.
- Ethiopian electronic-invoice profile/evidence workflow.
- configurable payroll rather than hard-coded statutory assumptions.

## Production localization requirements

The following are **configurable extensions** and must be legally validated for the actual go-live date rather than permanently hard-coded:

### Tax engine
- VAT: configurable tax code; 15% may be provisioned as the standard Ethiopian VAT profile when applicable.
- WHT: configurable withholding codes by transaction/counterparty class.
- TOT: effective-dated rules where the entity is subject to turnover tax rather than VAT.
- profit tax: reporting/tax-return support should derive from posted accounting results and approved tax configuration.
- customs/duties: landed-cost/tax codes with supplier/import documentation references.
- exemptions/zero-rate treatment: explicit tax code and evidence requirements.

Every tax rule needs: code, legal label, rate/method, effective dates, ledger mapping, document behavior and audit history.

### Ethiopian calendar

Implement a presentation/service layer that can display Gregorian and Ethiopian calendar dates while storing canonical ISO/Gregorian dates in PostgreSQL. Do not store two competing transaction dates. Required surfaces: invoice dates, payroll periods, attendance, reports, filters, fiscal calendars and printable documents.

### Bilingual data entry

UI labels can switch language independently of business master data. Names/addresses should support Unicode and optional parallel local-language fields where customers need bilingual documents.

### TIN / business identity

Validation should be configurable by entity type and regulator format. Never reject legitimate historical/imported identifiers merely because a future format rule changed; imports require an exception/evidence path.

### Ethiopian geography

Add reference masters for region/city/zone/woreda/kebele where required by deployment. Keep codes versioned so administrative changes do not invalidate historical documents.

### Banking/payments

Reconciliation source adapters should support major Ethiopian banks, Telebirr, CBE Birr and other approved providers as independent connectors. Each connector maps to the same internal settlement contract: amount, direction, transaction ID, reference, counterparty, fee, withholding, currency and provider evidence.

---

# 6. UI/UX and process flows

## Navigation

Desktop uses a fixed dark graphite rail with three information groups:
- Core workspace
- Core operations
- Growth modules

Mobile uses a compact top bar plus bottom shortcuts and a modal/drawer navigation. No horizontal application chrome should force page zoom at 390 px.

## Dashboard by role

- **Owner:** Executive command center - cash, revenue, collections, controls, launch readiness.
- **Administrator:** Administration control center - users, setup, security, operating controls.
- **Accountant:** Finance control desk - cash, journals, AR/AP, tax, close.
- **Sales:** Sales command center - invoice creation, customer collections.
- **Inventory:** Inventory operations desk - stock, purchasing, transfers, valuation.
- **Manager:** Operations command center - sales, spending, stock and execution.
- **Staff:** Daily work center - assigned workflows.
- **Viewer:** Reporting workspace - approved read-only business information.

## Quote-to-cash

```text
Quotation draft
 -> sent
 -> accepted
 -> convert to Sales Order
 -> fulfill / invoice
 -> POST INVOICE
    -> receivable
    -> revenue
    -> VAT
    -> stock movement / COGS where applicable
 -> receive payment
 -> allocate to invoice
 -> paid / partially paid
```

Failures must be atomic: if financial or stock posting fails, the document must not appear successfully posted.

## Procure-to-pay

```text
Purchase Request
 -> submit
 -> approve/reject
 -> Supplier Quote comparison
 -> Purchase Order
 -> Goods Receipt
 -> Supplier Bill
 -> Payment
 -> reconciliation
```

Approval decisions are attributable. Receipt and invoice/payment are separate controls.

## Inventory transfer

```text
Draft transfer
 -> validate source/destination
 -> reserve/validate available quantity
 -> complete
 -> transfer-out movement
 -> transfer-in movement
 -> balances updated atomically
 -> audit event
```

## Reconciliation

```text
Configure MFA-protected source
 -> import/callback settlement data
 -> normalize + hash + duplicate check
 -> matching suggestions
 -> review target and allocation
 -> confirm match
 -> post journal/allocation
 -> immutable reconciliation event
```

A reversal creates reversal evidence; it does not silently delete the original confirmed match.

## Payroll

```text
Employee + salary structure
 -> attendance/leave inputs
 -> create payroll run
 -> calculate
 -> review missing structures/exceptions
 -> approve
 -> post accounting
 -> record payment
```

Calculation readiness and statutory filing readiness are separate concepts.

## Electronic invoicing

```text
Posted invoice
 -> prepare immutable clearance payload
 -> manual/approved provider submission
 -> pending
 -> accepted OR rejected
 -> preserve official evidence
 -> optional cancellation request
 -> official cancellation completion
```

No official ID, QR, signature or clearance result may be fabricated by the application.

---

# 7. RBAC matrix

| Capability | Owner | Admin | Accountant | Sales | Inventory | Manager | Staff | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Company configuration | Full | Full | Limited | - | - | Read | - | Read |
| User/role administration | Full | Full | - | - | - | - | - | - |
| Finance posting | Full | Full | Full | Restricted workflow | Restricted workflow | Approval/read | Assigned | Read |
| Sales documents | Full | Full | Read/post controls | Full | Read | Full/read | Assigned | Read |
| Purchasing | Full | Full | Finance controls | Request/read | Full operational | Approve/read | Assigned | Read |
| Inventory adjustment/count | Full | Full | Financial review | Read | Full | Approve/read | Assigned | Read |
| Payroll | Full | Admin policy | Accounting post | - | - | Restricted | Restricted | Read only if explicitly granted |
| Reconciliation configuration | MFA | MFA | MFA finance | - | - | - | - | - |
| E-invoice issuer configuration | MFA | MFA | Read/operate by policy | - | - | - | - | - |
| Production controls | MFA | MFA | Read evidence by policy | - | - | - | - | - |
| Reports/export | Full | Full | Full | Scoped | Scoped | Full | Scoped | Read/export if granted |

The database policy remains authoritative; the UI must never infer permission solely from hidden/disabled controls.

---

# 8. API and integration structure

## Internal API principles

- organization ID is always derived/validated against authenticated membership;
- privileged actor IDs must match `auth.uid()`;
- server mutations validate role and state transition;
- accounting/stock side effects execute in database transactions/RPCs;
- retries must be idempotent where external callbacks are involved;
- secrets live in server environment/vault facilities, never browser-readable configuration rows.

## Provider adapters

### Banks/imports
Contract:
`source -> import batch -> normalized reconciliation transactions -> match -> journal/allocation -> evidence`.

### Telebirr
Callback credentials/token stay server-side. Provider payload is normalized into reconciliation provider events/transactions before accounting.

### M-Pesa / Daraja
Same normalized settlement model, with provider-specific connection checks and secure credential storage.

### E-invoicing / eTIMS-style integration
The application exposes an adapter boundary but does not hard-code an unverified authority endpoint. When approved provider documentation is supplied, implementation must include sandbox verification, certificate/key custody, request signing, idempotency, provider request/response IDs, evidence retention and operational failure/retry queues.

---

# 9. Reports

Required report families:

- Trial balance
- General ledger
- Profit & loss
- Balance sheet
- Cash-flow statement
- AR aging / customer statement
- AP aging / supplier statement
- tax/VAT transaction schedules
- sales by period/customer/product/branch
- margin analysis
- inventory position and valuation
- stock movement and count variance
- reorder/expiry/lot/serial reports
- purchasing commitments and supplier exposure
- payroll register and payslips
- attendance/leave summaries
- fixed asset register and depreciation schedule
- reconciliation unmatched/matched/disputed reports
- e-invoice clearance/rejection/cancellation register
- user/security/audit evidence exports
- onboarding/readiness status

Reports must carry AetherERP report chrome while preserving the legal company identity as the dominant document identity. Financial exports use tabular numerals and explicit currency/date context.

---

# 10. Deployment and infrastructure

## Recommended current stack

Retain the implemented stack:
- Next.js 16 / React 19 / TypeScript
- PostgreSQL on Supabase
- Supabase Auth + RLS
- SQL migrations, triggers and controlled workflow functions
- Vercel-compatible web runtime

This is preferable to moving to Odoo/Laravel/Django because the production ERP workflows and schema from the archive are already implemented in this stack. Replatforming would create unnecessary fidelity and migration risk.

## Deployment profiles

### Cloud
- primary managed PostgreSQL/Supabase deployment;
- Vercel/Node frontend;
- encrypted backup and tested restore evidence;
- regional latency and data-residency review per customer/regulator requirement.

### Private/on-premise option
For customers requiring local hosting, package PostgreSQL, app server and object storage behind a customer-managed reverse proxy/VPN. The same migrations and RLS policies must be used. Provider integrations need outbound egress controls and secret management.

### Offline-resilient operations
Do not make the general ledger offline-first. Where intermittent connectivity matters, use bounded offline queues for explicitly safe operational capture (for example e-invoice queue or field transactions) with idempotency, conflict policy and server confirmation before final posting.

---

# 11. Migration/import strategy

1. Freeze source-system cutover scope and identifiers.
2. Import organization, branches, warehouses and configuration.
3. Import customer/supplier masters, preserving source IDs in migration cross-reference tables/files.
4. Import product/SKU master.
5. Load opening stock by warehouse through controlled opening movements.
6. Load chart of accounts/tax codes and opening balances through a balanced opening journal.
7. Import open AR/AP documents with source references.
8. Reconcile imported subledger totals to control accounts.
9. Import optional historical documents/events into clearly marked history partitions/contracts where supported.
10. Perform parallel-cycle validation.
11. Lock legacy source, complete first AetherERP close and retain migration evidence.

Every import produces: source row count, accepted row count, rejected rows/reasons, control totals, checksum/file identity and operator timestamp.

---

# 12. Implementation roadmap

## Gate 0 - source freeze and fidelity
- PDF-to-route/component/table matrix complete.
- canonical migration list frozen for release.
- representative business flows covered by regression tests.

## Gate 1 - AetherERP identity
- Aether logo, metadata, PWA manifest and shell.
- Cormorant Garamond + Sora + IBM Plex Mono.
- dark graphite/teal brand authority.
- login, dashboard chrome, reports and system email presentation.
- compatibility identifiers retained internally.

## Gate 2 - localization verification
- English/Amharic regression.
- existing Tigrinya source catalog verification.
- ETB/multi-currency, date/timezone and TIN behavior.
- configurable effective-dated tax rule review.

## Gate 3 - accounting/inventory controls
- journal balance/immutability/period-lock tests.
- invoice atomic posting tests.
- negative stock, transfer and count controls.
- AR/AP and reconciliation control totals.

## Gate 4 - privileged security
- RLS coverage audit.
- owner/admin AAL2 gates.
- security alerts and audit export.
- backup/restore evidence.
- secret/configuration review.

## Gate 5 - compliance-provider readiness
- payroll rate review by qualified Ethiopian professional.
- tax templates reviewed for current obligations.
- electronic-invoice provider/authority documentation approved before direct submission.
- bank/mobile-money adapters sandbox-tested.

## Gate 6 - production release
- `npm run check`
- `npm run audit:production`
- `npm run verify:production`
- deployment smoke tests on 390 px mobile and 1440+ desktop
- user-acceptance flows by Owner, Accountant, Sales, Inventory and Administrator roles
- first-close and backup/restore rehearsal

---

# 13. Gaps and recommended production extensions

These are **extensions**, not claims that the source archive already implements them fully:

1. Add versioned Ethiopian region/zone/woreda reference masters if customer workflows require them.
2. Add a dual Gregorian/Ethiopian-calendar presentation service while retaining canonical database dates.
3. Expand tax configuration profiles for WHT/TOT/customs/profit-tax reporting after legal review.
4. Add bank adapters incrementally using the existing reconciliation source contract rather than custom accounting paths.
5. Add a regulator/provider adapter only after official e-invoice/eTIMS integration specifications are contractually available.
6. Add a generated field-level data dictionary in CI from the live migration schema so documentation cannot drift.
7. Add branded PDF templates for invoice, credit note, customer statement, supplier statement, payslip and statutory working papers.
8. Keep certifications separate from controls: never display SOC/ISO certification language unless certification evidence exists.

---

# 14. Definition of production-ready

A release is production-ready only when:
- every archive workflow has a mapped route/component/schema contract;
- no source financial/business rule has been removed by the brand migration;
- tenant RLS and privileged MFA tests pass;
- accounting and inventory invariants pass automated tests;
- current Ethiopian statutory/tax configuration has been professionally reviewed for the customer;
- external provider credentials/endpoints are approved and sandbox-tested;
- backups and restore tests have current evidence;
- UI passes keyboard/focus/reduced-motion/mobile checks;
- release gate, typecheck, tests and production build pass.
