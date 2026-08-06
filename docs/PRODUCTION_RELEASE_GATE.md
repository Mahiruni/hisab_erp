# HisabERP production release gate

HisabERP uses a non-destructive production verification gate to detect availability, authentication-boundary and security-header regressions without creating or changing business records.

## Automated checks

The gate verifies:

- the production health endpoint returns HTTP 200, reports `status: ok`, confirms database configuration and exposes a deployment version;
- sign-in, email sign-up and password-recovery pages render successfully;
- Content Security Policy, HSTS, clickjacking protection and MIME-sniffing protection are present;
- audit-log export rejects unauthenticated requests;
- dashboard/financial export rejects unauthenticated requests;
- a machine-readable JSON report is retained as GitHub Actions evidence.

The scheduled workflow runs every day at 03:15 UTC (06:15 Africa/Addis_Ababa). It can also be started manually from GitHub Actions.

Run the same gate locally with:

```bash
npm run verify:production
```

To verify a different deployment or require a specific commit:

```bash
HISAB_PRODUCTION_URL=https://example.invalid \
HISAB_EXPECTED_VERSION=<commit-sha> \
npm run verify:production
```

## Authenticated workflow testing

Public release checks are intentionally read-only. Before onboarding a real business, use a disposable test organization and dedicated test identities to verify this full chain:

1. Create and verify an account.
2. Enroll an owner or administrator in authenticator MFA.
3. Create a customer and product.
4. Create and post an invoice.
5. Record and reconcile a payment.
6. Confirm balanced journals, inventory movement and audit events.
7. Confirm unauthorized roles cannot perform privileged actions.
8. Export audit evidence and remove the disposable test organization.

Never execute destructive test cleanup against a real customer organization.

## Production-control activation gates

The application already contains controls for administrator MFA, login and financial alerts, audit export, database health checks, encrypted logical backups and restore-test evidence. Operational activation still requires external configuration and human verification:

- Enable Supabase leaked-password protection.
- Enroll every owner and administrator in authenticator MFA.
- Configure the backup workflow secrets and verify `last_backup_at` is updated.
- Enable point-in-time recovery when the selected Supabase plan and recovery objective require it.
- Restore a real encrypted backup into an isolated disposable database and record successful evidence.
- Review production alerts and Vercel runtime errors after every release.

A production health check should remain in warning state until backup, restore and administrator-MFA evidence is current. This is intentional: implemented code is not the same as an activated control.
