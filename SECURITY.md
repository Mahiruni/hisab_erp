# Security policy

## Reporting

Do not open public issues containing credentials, customer data, financial data or exploit details. Contact the repository owner privately and include the affected route, impact and reproduction steps.

## Production requirements

- Revoke any GitHub, Supabase or Vercel credential pasted into chat, logs or source control.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Enable MFA for administrators and owners.
- Apply the SQL migration before enabling live forms.
- Keep RLS enabled on every exposed table.
- Review audit events and authentication logs.
- Run dependency and backup-restore checks before each release.

The `/legacy` route is a demonstration and must never contain real business data.
