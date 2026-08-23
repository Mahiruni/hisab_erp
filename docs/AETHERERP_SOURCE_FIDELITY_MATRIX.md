# AetherERP source-fidelity matrix

**Source specification:** `HisabTech_Software_Dashboard_Content_Archive_2026-08-23.pdf` (52 pages, authenticated ERP archive, 23 August 2026)

**Implementation rule:** the archive was produced from this repository. Therefore the safest zero-loss transformation is to retain the existing transaction model, migrations, RLS policies, workflows, routes, tests and operational copy, while replacing customer-facing identity with AetherERP. No accounting, inventory, payroll, reconciliation, security or e-invoicing data contract is renamed as part of the visual rebrand.

## Fidelity principles

1. Source behavior wins over rebrand convenience.
2. Financial postings, audit events, document numbers, tenant keys and migration history are immutable compatibility contracts.
3. The AetherERP brand is applied at presentation, metadata, login, shell, reports, email and documentation layers.
4. Legacy internal identifiers may remain where renaming would require destructive migration; they are not customer-facing brand surfaces.
5. Private production rows, credentials, recovery material and provider secrets remain outside documentation, matching the archive privacy boundary.
6. Regulatory rates and provider credentials are configurable/effective-dated. The system must not fabricate government endpoints or statutory evidence.

## PDF section -> implementation map

| PDF pages | Source area | Route / UI implementation | Data / workflow implementation | Fidelity disposition |
|---|---|---|---|---|
| 1-2 | Archive scope and privacy boundary | Whole authenticated application | RLS, audit, provider-secret boundaries | Preserved; no live customer rows copied into docs |
| 3-4 | Authenticated route register | `/`, `/modules`, `/finance`, `/finance/journals`, `/sales`, `/sales/invoices/new`, `/customers`, `/purchasing`, `/inventory`, `/reports`, `/reconciliation`, `/hr`, `/e-invoicing`, `/onboarding`, `/account`, `/security`, `/billing`, `/checkout` | Next.js App Router + Supabase server actions | Preserved 1:1 |
| 5 | Workspace shell and navigation | `components/workspace-shell.tsx` | role/context session lookup, route-aware navigation | Logic retained; visible brand replaced by AetherERP |
| 6 | Role-adaptive dashboard | `components/dashboard-role-profiles.ts`, `components/dashboard.tsx`, `components/dashboard-interface-copy.ts` | Owner, Administrator, Accountant, Sales, Inventory, Manager, Staff, Viewer profiles | Preserved 1:1 |
| 7-8 | Business overview dashboard | Dashboard components + localized copy | management KPIs and recent activity | Preserved; illustrative values remain demo-only |
| 9-14 | 12-module architecture | `/modules`, module catalog components | `lib/erp-modules.ts`, `lib/operational-modules.ts` | Preserved: priorities, phases, capabilities and governance |
| 15-16 | Sales & Invoicing | `components/sales-workspace.tsx`, `/sales`, `/sales/invoices/new` | sales quotation/order/invoice/receipt/return RPCs and tables | Preserved 1:1 |
| 17-18 | Purchasing & AP | `components/purchasing-workspace.tsx`, `/purchasing` | procure-to-pay schema/workflows, approvals | Preserved 1:1 |
| 19-20 | Inventory & Warehouse | `components/inventory-operations-workspace.tsx`, `/inventory` | stock balances, movements, transfers, counts, adjustments, lot/serial | Preserved 1:1 |
| 21-22 | Finance & Accounting | `components/finance-workspace-v2.tsx`, `/finance`, `/finance/journals` | double-entry ledger, periods, bank, tax, assets, closing | Preserved 1:1 |
| 23-25 | Bank/payment reconciliation | `components/reconciliation-workspace.tsx`, `/reconciliation` | source mapping, imports, suggestions, matches, reversals, disputes | Preserved 1:1 |
| 26-28 | HR & Payroll | `components/hr-payroll-workspace.tsx`, `/hr` | employees, attendance, leave, salary structures, payroll runs/items | Preserved 1:1; statutory rates stay configurable |
| 29-31 | Electronic invoicing | `components/e-invoicing-workspace.tsx`, `/e-invoicing` | profiles, documents, lifecycle events | Preserved; provider-neutral/manual clearance remains the safe default |
| 32-34 | Company launch | `app/onboarding/page.tsx`, readiness roadmap | organization bootstrap, branch/warehouse creation, imports, opening balance | Preserved 8-step launch model |
| 35 | Customer directory | `app/customers/page.tsx` | `customers` | Preserved; live rows excluded from documentation |
| 36 | Reports | `app/reports/page.tsx` | management snapshot + CSV export | Preserved; financial-statement caveat retained |
| 37-38 | Account & security | `app/account/page.tsx`, `components/mfa-security-panel.tsx` | auth/session/MFA security tables and policies | Preserved AAL2/session semantics |
| 39-41 | Production controls | `app/security/page.tsx` | MFA gates, audit, backup evidence, alerts, health checks | Preserved 8 control families |
| 42-43 | Shared operational language | `lib/core-operations-copy.ts`, operational UI components | shared action/status vocabulary | Preserved |
| 44 | Operational models/statuses | generic operational module surfaces | `operational_records`, `operational_record_events` + module status contracts | Preserved |
| 45-47 | English/Amharic/Tigrinya | locale and shared operation catalogs | localization layer | Preserved; Tigrinya remains source-level where not exposed on every route |
| 48-50 | Production schema inventory | N/A | 79 verified public base tables listed below | Preserved; migrations remain canonical |
| 51-52 | Coverage/handoff | Documentation and tests | release/production checks | Preserved |

## Route register

| Route | Workspace | Contract |
|---|---|---|
| `/` | Dashboard / Business overview | role-adaptive command center |
| `/modules` | ERP module catalog | architecture, phases, features, controls |
| `/finance` | Finance & Accounting | overview, journals, chart, payments, tax, assets, close |
| `/finance/journals` | Journal workspace | balanced posting and review |
| `/sales` | Sales & Invoicing | quote-to-cash |
| `/sales/invoices/new` | New invoice | direct customer invoice posting |
| `/customers` | Customers | directory and credit limits |
| `/purchasing` | Purchasing & AP | procure-to-pay |
| `/inventory` | Inventory & Warehouse | products, transfers, counts, adjustments, tracking |
| `/reports` | Reports | management snapshot and export |
| `/reconciliation` | Reconciliation | bank/Telebirr/M-Pesa matching and posting |
| `/hr` | HR & Payroll | employees, time, leave, payroll |
| `/e-invoicing` | Electronic Invoicing | issuer profile and clearance evidence lifecycle |
| `/onboarding` | Company Launch | eight-step setup |
| `/account` | Account & security | identity, MFA, session posture and recovery |
| `/security` | Production controls | security, backup, audit and health controls |
| `/billing` | Billing | subscription/access state |
| `/checkout` | Checkout | plan/payment handoff |

## Module catalog retained from the archive

| # | Module | Priority | Phase |
|---:|---|---|---:|
| 1 | Finance & Accounting | Must have | 1 |
| 2 | Sales & Invoicing | Must have | 1 |
| 3 | Purchasing & Expenses | Must have | 1 |
| 4 | Inventory & Warehouse | Must have | 1 |
| 5 | Customers & Suppliers | Must have | 1 |
| 6 | Security, Approvals & Audit | Must have | 1 |
| 7 | Reports & Analytics | Must have | 1 |
| 8 | Localization & Compliance | Must have | 1 |
| 9 | Human Resources & Payroll | Should have | 2 |
| 10 | Fixed Assets | Should have | 2 |
| 11 | Budgeting & Projects | Should have | 2 |
| 12 | Integrations & Automation | Growth | 3 |

## High-value field mapping from the PDF

### Company / tenant
- Owner full name -> authenticated user / `organization_members.full_name`
- Company name -> `organizations.name`
- TIN -> `organizations.tin`
- Base currency -> `organizations.base_currency`
- Timezone -> `organizations.timezone`
- Primary branch -> `branches`
- Operating inventory location -> `warehouses`
- User role -> `organization_members.role`

### Customers / suppliers
- Name, email, phone, TIN -> customer/supplier master
- Credit limit -> customer/supplier credit control
- Payment terms -> master payment terms
- Bank details -> supplier master/bank-related procurement data
- Activity and balance -> source documents + ledger/reconciliation history

### Sales documents
- Customer
- quotation/order/invoice date
- valid-until / expected / due date
- customer reference
- notes
- product + warehouse
- quantity
- unit price
- discount percentage
- tax percentage
- gross / discount / tax / total
- status + status history
- immutable accounting/stock posting when invoiced

### Procurement documents
- purchase request date, needed-by, department, requester, notes
- supplier quote request/supplier/reference/date/valid-until/notes
- item/warehouse/description/quantity/amount/tax
- approval/rejection/conversion status
- PO, goods receipt, supplier bill, purchase return lifecycle

### Inventory
- warehouse, SKU, product name, unit/cost price
- opening quantity, reorder level
- transfer from/to/date/notes
- stock count variance and status
- adjustment increase/decrease/reason
- lot, serial and expiry tracking

### Finance
- account code/name/type/normal side/subtype/currency/manual-posting flag
- journal entry number/date/memo/status/source/posting actor/timestamp
- journal line account/description/debit/credit
- period start/end/status/lock actor/time
- tax code/rate/type/effective dates/account
- bank ledger/account mapping/currency
- fixed-asset acquisition, cost, salvage, useful life, depreciation and linked accounts

### Reconciliation
- source type: bank, Telebirr, M-Pesa
- provider/import method and environment
- cash, fee, withholding and suspense accounts
- source status, merchant/account reference, amount/date tolerance
- duplicate-hashed statement ingestion
- transaction states: unmatched, suggested, partial, matched, disputed, ignored
- match targets: customer invoice, supplier bill, ledger account, suspense account
- allocation rule: allocation = cash + fee + withholding; cash = allocation - fee - withholding
- reason fields for match/reversal/dispute/ignore

### HR / payroll
- employee identity/contact, Tax ID, Pension ID, hire date
- employment class: Permanent, Contract, Temporary, Intern
- department, position, bank and masked account
- salary structure
- attendance date/status/check-in/check-out/regular/overtime/notes
- leave type/date range/days/reason/status
- payroll period/pay date/notes/gross/pension/income tax/net/status

### E-invoicing
- legal business name, TIN, VAT, commercial registration
- provider, environment, submission method, readiness status
- provider reference and certificate alias (reference only)
- immutable prepared payload/hash
- official invoice/receipt ID, QR payload, verification URL
- certificate serial, digital signature, provider request/response IDs, response evidence JSON
- rejection code/reason and cancellation references/reasons

## Production base-table inventory: 79 tables

### Finance & ledger (9)
`accounting_periods`, `accounts`, `asset_depreciation_runs`, `bank_accounts`, `fixed_assets`, `journal_entries`, `journal_lines`, `payments`, `tax_codes`

### Sales & customers (9)
`customers`, `sales_invoice_items`, `sales_invoices`, `sales_order_items`, `sales_orders`, `sales_quotation_items`, `sales_quotations`, `sales_return_items`, `sales_returns`

### Purchasing & suppliers (14)
`goods_receipt_items`, `goods_receipts`, `purchase_order_items`, `purchase_orders`, `purchase_request_items`, `purchase_requests`, `purchase_return_items`, `purchase_returns`, `supplier_bill_items`, `supplier_bill_payments`, `supplier_bills`, `supplier_quote_items`, `supplier_quotes`, `suppliers`

### Inventory (11)
`inventory_adjustments`, `inventory_lots`, `inventory_serials`, `products`, `stock_balances`, `stock_count_items`, `stock_counts`, `stock_movements`, `stock_transfer_items`, `stock_transfers`, `warehouses`

### HR & payroll (6)
`attendance_entries`, `employees`, `leave_requests`, `payroll_items`, `payroll_runs`, `salary_structures`

### Reconciliation & integrations (8)
`integration_connection_checks`, `mpesa_daraja_connection_checks`, `reconciliation_events`, `reconciliation_import_batches`, `reconciliation_matches`, `reconciliation_provider_events`, `reconciliation_sources`, `reconciliation_transactions`

### E-invoicing (3)
`e_invoice_documents`, `e_invoice_events`, `e_invoice_profiles`

### Security & governance (10)
`approval_requests`, `audit_events`, `auth_audit_events`, `auth_sessions`, `database_health_checks`, `login_attempts`, `production_control_settings`, `recovery_codes`, `security_alerts`, `user_security_profiles`

### Organization & platform (9)
`branches`, `business_invitations`, `demo_requests`, `document_counters`, `onboarding_progress`, `operational_record_events`, `operational_records`, `organization_members`, `organizations`

## Exact database contract

The migration set under `supabase/migrations/` is the field-level source of truth. It already contains concrete PostgreSQL types, foreign keys, checks, generated values, indexes, row-level-security policies, grants/revokes, triggers and security-definer workflow functions. Examples from the production foundation include:

- `organizations.id uuid primary key default gen_random_uuid()`
- organization `name text not null` with 2-160 character check
- `base_currency char(3) default 'ETB'`
- `timezone text default 'Africa/Addis_Ababa'`
- customer `credit_limit numeric(18,2)` with non-negative check
- product quantity and reorder levels as `numeric(18,3)`
- journal debits/credits as `numeric(18,2)` with exactly-one-side-positive constraint
- journal status enum `draft | posted | reversed`
- invoice status enum `draft | posted | partially_paid | paid | void`
- generated invoice total = subtotal + tax amount
- accounting period state `open | soft_closed | locked`
- tax rate `numeric(7,4)` and effective dates
- fixed asset straight-line depreciation controls and value bounds

Because this is already executable DDL, duplicating every SQL line into a prose document would create a second, potentially stale source of truth. The migrations remain authoritative; this matrix exists to prove that every archive area resolves to an implemented route, component, workflow and schema family.
