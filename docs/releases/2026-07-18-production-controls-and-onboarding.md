# Production controls and guided onboarding

Release date: July 18, 2026

## Serious production controls

- Owner and administrator mutations require a Supabase AAL2 authenticator session in both Next.js and PostgreSQL.
- Authenticator TOTP enrollment, challenge and verification are available from Account Security.
- New and reset passwords are screened for predictable patterns and known breach exposure using a privacy-preserving hash-prefix lookup.
- Successful email sign-ins and failed attempts are recorded without storing raw passwords or reusable identifiers.
- Authentication and material financial actions generate organization-scoped security alerts.
- Business, authentication and alert streams can be exported as a spreadsheet-safe CSV only by an MFA-verified administrator.
- PostgreSQL runs a daily health check for negative stock, unbalanced posted journals, RLS coverage, administrator MFA and continuity evidence.
- Production-control settings and backup/restore evidence are tenant-isolated with RLS and immutable audit events.
- Encrypted PostgreSQL backup and guarded isolated restore scripts are included.
- A daily GitHub Actions backup workflow activates when the repository owner configures `SUPABASE_DATABASE_URL` and `BACKUP_ENCRYPTION_PASSPHRASE` secrets.
- Anonymous execution of `SECURITY DEFINER` functions has been removed across the public schema.
- Remaining uncovered foreign-key relationships received leading-column indexes.

## Guided onboarding

The original company bootstrap has been replaced with a data-backed eight-step launch center:

1. Company legal and operating profile
2. Branches and linked warehouses
3. Customer and supplier CSV imports
4. Product catalog and opening-stock CSV import
5. Chart-of-accounts and tax-code review
6. Balanced opening-balance journal
7. First live sales invoice
8. Administrator MFA readiness

Progress is calculated from real organization data and updates automatically. Import files are limited to 2 MB and 1,000 rows, and opening-stock posting is separately retryable from product-master import.

## Platform-owner configuration still required

- The connected Supabase project is on the Free plan. Point-in-time recovery remains deliberately marked unavailable until the project is upgraded and PITR is enabled.
- Add the two GitHub backup secrets before considering daily encrypted backups active.
- Add `MONITORING_WEBHOOK_URL` in Vercel when an external incident platform is selected. Vercel runtime logs and database security alerts remain active without it.
- Every current and future owner/administrator must personally enroll and verify an authenticator factor.
