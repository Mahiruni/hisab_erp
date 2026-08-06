# Hisab ERP — production foundation

Hisab ERP is a multilingual Next.js application for Ethiopian businesses. The native application includes a production-oriented Supabase/PostgreSQL foundation while retaining the original HTML prototype at `/legacy` as a clearly marked demonstration.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Without Supabase variables the application runs in **safe demo mode** using sample data. Live write actions are disabled.

## Enable live mode

1. Create a Supabase project.
2. Run every ordered SQL file in `supabase/migrations/` by migration timestamp.
3. Add the public Supabase URL and publishable key to `.env.local` and Vercel.
4. Add the production `/auth/callback` URL to Supabase Auth redirects.
5. Create an account and finish organization onboarding.

The connected Hisab Technologies Supabase project already has the Finance, Sales and shared operational-module migrations applied. The committed migration files keep new environments and disaster-recovery restores reproducible.

## Google OAuth configuration

Google sign-in is handled by Supabase Auth. Keep the Google OAuth client secret only in the Supabase dashboard—never commit it to GitHub or expose it as a public environment variable.

For the production Google **Web application** OAuth client, configure:

**Authorized JavaScript origins**

```text
https://www.hisabtech.com
https://hisabtech.com
http://localhost:3000
```

**Authorized redirect URIs**

```text
https://amwpbnczylbarqqcprev.supabase.co/auth/v1/callback
```

In Supabase **Authentication → URL Configuration**, use `https://www.hisabtech.com` as the production Site URL and allow these application redirects:

```text
https://www.hisabtech.com/auth/callback
https://hisabtech.com/auth/callback
http://localhost:3000/auth/callback
```

After changing Google OAuth settings, start a completely new sign-in attempt from the HisabERP login page. Do not reuse an old Google error or callback tab because its OAuth state may have expired.

## Production architecture

- Next.js App Router and React Server Components
- Persistent authenticated workspace shell with docked navigation
- Supabase Auth using cookie-based SSR clients
- PostgreSQL with organization-level Row Level Security
- Double-entry general ledger and atomic operational posting
- Fiscal periods with soft-close and hard-lock controls
- VAT configuration, cash/bank records, receipts and payment allocation
- Quote-to-cash workflow with multi-line commercial documents
- Shared operational record and event-history foundation for every remaining ERP module
- Role-aware creation and status workflows with unique document numbers and audit events
- English, Amharic and Tigrinya labels with server-resolved language cookies
- Persistent light and dark appearance modes
- Global branded loading transitions and translated completion confirmations
- CSP/security headers, route protection, health checks and CI

## Finance & Accounting — Phase 1

The `/finance` workspace is the financial source of truth for sales, expenses, payments, taxes, assets and closing periods. It includes:

- overview with current-month profit and loss, balance-sheet position and trial-balance integrity
- chart of accounts and cash/bank account creation
- balanced manual journal posting with immutable posted history
- customer receipts, supplier payments, expenses and invoice allocation
- input/output VAT position
- asset registration, acquisition posting and monthly straight-line depreciation
- accounting periods with open, soft-closed and locked states
- organization, role and accounting-period validation on every posting RPC

## Sales & Invoicing — Phase 1

The `/sales` workspace manages the complete customer workflow:

- multi-line quotations with validity dates, discounts, VAT and status tracking
- direct sales orders or conversion from quotations
- direct invoices or atomic order-to-invoice conversion
- stock issue, receivable, sales revenue, output VAT and COGS posting in one transaction
- customer receipts with optional invoice allocation and automatic status updates
- customer returns with inventory, COGS, VAT and receivable reversal
- customer statements with invoiced, received, returned, outstanding and available-credit balances
- role, tenant, credit-limit, inventory and accounting-period validation

## Remaining operational modules

Every remaining roadmap module now opens an operational workspace with live organization-scoped records, owners, counterparties, amounts, priorities, due dates, status history, activity, translated labels and governance controls:

- Purchasing & Expenses
- Inventory & Warehouse
- Customers & Suppliers
- Security, Approvals & Audit
- Reports & Analytics
- Localization & Compliance
- Human Resources & Payroll
- Fixed Assets operations
- Budgeting & Projects
- Integrations & Automation

The shared operational foundation is an extensible workflow layer. Domain-specific statutory calculations, payroll tax engines, banking connectors and third-party integrations still require their respective production configuration and professional review.

## Product experience

- all internal navigation and form submissions use the branded Hisab orbit loader
- successful create, update and monetary actions show translated completion messages with document numbers and ETB amounts
- the appearance toggle persists light or dark mode locally
- the language toggle refreshes English, Amharic and Tigrinya server and client content
- responsive cards, tables, forms, focus states and reduced-motion support are included
- the docked footer identifies HisabTech.com and links to hisabtechnologies.com

## Main routes

- `/` dashboard using live data when authenticated
- `/finance` Finance & Accounting workspace
- `/sales` Sales & Invoicing workspace
- `/modules/[slug]` operational workspaces for all remaining modules
- `/customers` customer directory and creation
- `/inventory` stock and product creation
- `/modules` ERP architecture and module directory
- `/reports` financial dashboard reporting and CSV export
- `/docs/setup` deployment checklist
- `/legacy` browser-only demonstration; never use for real data

## Validation

```bash
npm run typecheck
npm test
npm run build
```

Read `SECURITY.md`, `docs/IMPLEMENTATION_STATUS.md` and `docs/BACKUP_AND_RECOVERY.md` before production use.

<!-- Production deployment trigger: 2026-07-31 -->
