# Implementation status

## Implemented in the production foundation

- Supabase SSR authentication utilities and protected routes
- Company onboarding, branches, memberships and role model
- PostgreSQL schema with RLS tenant isolation
- Persistent docked ERP navigation with inside-workspace route changes
- Customers, products, warehouses and stock balances
- Double-entry accounts, journal entries and immutable posted journals and lines
- Append-only audit events and approval-request foundation
- Live/demo data access layer
- Operational workspaces for every ERP roadmap module
- Cookie-backed first-render language selection
- English, Amharic and Tigrinya client/server refresh behavior
- Persistent light and dark appearance modes
- Global branded loading transitions and translated completion confirmations
- CSP, security headers, error pages, health endpoint and CI

## Finance & Accounting — Phase 1 complete

- Finance overview with profit and loss, balance-sheet position and trial-balance validation
- Expanded chart of accounts with cash, bank, tax, fixed-asset and depreciation classifications
- Secure creation of organization-scoped finance accounts
- Balanced manual journal posting through a role-checked atomic RPC
- Customer receipts, supplier payments and expense posting
- Open-invoice receipt allocation and invoice status updates
- Input and output VAT configuration and net tax position
- Fixed-asset registration and acquisition posting
- Monthly straight-line depreciation with duplicate-period prevention
- Open, soft-closed and locked accounting periods
- Period-lock enforcement on all journal-based operational posting
- Audit events and covering indexes for finance workflows

## Sales & Invoicing — Phase 1 complete

- Unified `/sales` quote-to-cash workspace
- Multi-line quotations, sales orders and invoices
- Atomic receivable, revenue, VAT, COGS, inventory and stock posting
- Customer receipts, invoice allocation and payment statuses
- Customer returns, credits and accounting reversals
- Customer statements and available credit
- Tenant RLS, role checks and rollback-only end-to-end verification

## Dedicated core operations complete

### Purchasing & Accounts Payable

- Supplier master records and balances
- Purchase requests with approval decisions
- Supplier quotations and quote-to-purchase-order conversion
- Purchase orders, goods receipts and three-way quantity matching
- Supplier bills, input VAT, accounts-payable journals and payments
- Purchase returns, supplier credits and stock/accounting reversals

### Inventory & Warehouse

- Stock position by product and warehouse
- Reorder alerts and inventory valuation
- Inter-warehouse transfers
- Physical stock counts and variance posting
- Manual inventory adjustments with balanced journals
- Lot, expiry and serial-number tracking

### Human Resources & Payroll

- Employee records, departments and positions
- Attendance, overtime and leave approvals
- Effective-dated salary structures
- Configurable allowances, deductions, pension and income-tax rates
- Payroll calculation, approval, ledger posting and payment confirmation
- Professional payroll and statutory review remains required before filing

## Serious production controls complete

- Owner and administrator mutations require an AAL2 authenticator session in both Next.js and PostgreSQL
- TOTP authenticator enrollment, challenge and verification from Account Security
- New and reset passwords screened for predictable patterns and known breach exposure
- Authentication and material financial-action alerts
- MFA-protected, spreadsheet-safe audit export
- Daily database health checks through PostgreSQL cron
- Encrypted logical backup and guarded isolated restore-drill tooling
- Backup and restore evidence tracking
- Anonymous execution removed from public security-definer functions
- Remaining uncovered foreign-key relationships indexed

## Guided onboarding complete

- Eight-step, data-backed company launch center
- Company profile and business-model configuration
- Branch and linked-warehouse creation
- Customer and supplier CSV imports
- Product catalog and opening-stock CSV imports
- Chart-of-accounts and VAT-code review
- Balanced opening-balance journal posting
- First-invoice launch guidance
- Administrator MFA readiness

## Remaining roadmap modules — operational foundation complete

The following modules have working organization-scoped workspaces backed by the shared operational record, status-history and audit-event layer:

- Customers & Suppliers
- Security, Approvals & Audit
- Reports & Analytics
- Localization & Compliance
- Fixed Assets operations
- Budgeting & Projects
- Integrations & Automation

Each workspace includes module-specific record types and statuses, create/update forms, counterparties, owners, amounts, due dates, priorities, recent activity, metrics, translated labels, role-aware write access and governance controls.

## Product experience complete

- branded Hisab orbit loader on internal navigation and form submission
- route-level loading state
- translated create, update and monetary confirmation toast
- persistent light and dark toggle
- upgraded English, Amharic and Tigrinya segmented language control
- expanded docked navigation for all phases
- responsive and reduced-motion styles
- Powered by HisabTech.com and hisabtechnologies.com footer branding

## Validation

- TypeScript, automated tests and production Next.js build passed for PR #11
- AAL1 owners retain tenant read membership but cannot perform privileged operations
- AAL2 owners can access production-control and onboarding RPCs
- Purchasing, inventory, payroll and onboarding rollback-only workflows passed
- No rollback-test records remain in the production database
- New control tables use organization-scoped RLS
- Anonymous execution of public security-definer functions is zero
- Foreign-key relationships have supporting leading-column indexes

## Production deployment trigger

A fresh `main` deployment was requested on July 18, 2026 after merging production controls and guided onboarding. A second release trigger was committed after the Vercel Hobby build-rate cooldown to deploy the complete validated source tree.

## Requires project-owner configuration and specialist review

- Add GitHub repository secrets `SUPABASE_DATABASE_URL` and `BACKUP_ENCRYPTION_PASSPHRASE` to activate scheduled encrypted backups
- Upgrade the Supabase project and enable point-in-time recovery before marking PITR ready
- Add `MONITORING_WEBHOOK_URL` in Vercel when an external incident platform is selected
- Every owner and administrator must personally enroll an authenticator factor
- Enable Supabase Auth native leaked-password protection as an additional platform-level control
- Verify font redistribution rights
- Obtain professional accounting, tax, payroll and compliance review before statutory use
- Configure external banking, filing and third-party integration credentials before production use
