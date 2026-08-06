# Bank, Telebirr and Safaricom M-Pesa reconciliation

## Purpose

Hisab imports bank and provider settlements into an idempotent reconciliation register, suggests likely business-document matches and requires an authorized person to confirm every accounting posting.

## Supported operating modes

- Bank CSV, TSV and text statement imports
- Telebirr payment callbacks through a provider-neutral adapter
- Safaricom M-Pesa C2B and STK callback normalization through a Daraja adapter
- Manual matching to customer invoices, supplier bills, ledger accounts or suspense
- Partial settlement allocation
- Bank and provider fees
- Withholding receivable or payable
- Reversible journal and payment evidence

## Accounting rules

Incoming settlement:

- Debit cash or mobile-wallet ledger by the net cash received
- Debit provider fee expense when applicable
- Debit withholding receivable when applicable
- Credit accounts receivable, a selected ledger account or suspense by the gross allocation

The enforced equation is:

`allocation = cash + fee + withholding`

Outgoing settlement:

- Debit accounts payable, a selected ledger account or suspense by the allocation
- Debit bank or provider fee expense when applicable
- Credit withholding payable when applicable
- Credit cash or mobile-wallet ledger by the net cash paid

The enforced equation is:

`cash = allocation + fee - withholding`

## Safety and control model

- Imported files are limited to 5 MB and 5,000 rows.
- File bytes receive a SHA-256 hash to prevent duplicate batch imports.
- Every normalized transaction has an organization/source idempotency key.
- Provider callbacks require a server-side callback token and the Supabase service-role key.
- Callback routes cannot post accounting entries.
- Direct client writes to reconciliation tables are revoked.
- RLS isolates every record by organization.
- Posting RPCs verify the authenticated actor, organization role, transaction balance, target balance and journal equality.
- Reversals create a separate posted reversal journal; original evidence is never deleted.

## Runtime environment variables

Set these only in server-side Vercel environments:

```text
SUPABASE_SERVICE_ROLE_KEY=...
TELEBIRR_CALLBACK_TOKEN=long-random-secret
MPESA_CALLBACK_TOKEN=long-random-secret
```

Never use the Supabase service-role key or callback tokens in `NEXT_PUBLIC_*` variables.

## Callback URL patterns

Telebirr:

```text
https://www.hisabtech.com/api/reconciliation/telebirr/callback?source=YOUR_SOURCE_REFERENCE&token=YOUR_CALLBACK_TOKEN
```

M-Pesa:

```text
https://www.hisabtech.com/api/reconciliation/mpesa/callback?source=YOUR_SOURCE_REFERENCE&token=YOUR_CALLBACK_TOKEN
```

The source reference must exactly match the active reconciliation source's account, shortcode or merchant reference.

## Provider activation checklist

Before changing a source from sandbox to production, obtain and test:

1. Approved merchant, shortcode or till identifier
2. Production callback registration procedure
3. Authentication and signature requirements
4. Official success and failure callback examples
5. Retry and duplicate-delivery behavior
6. Settlement and fee reports
7. Reversal, refund and timeout behavior
8. Sandbox acceptance evidence

The current implementation is integration-ready but is not a Telebirr or Safaricom certification claim.

## Statement columns

The parser recognizes common aliases for:

- transaction date and value date
- amount or separate debit and credit columns
- transaction direction
- provider transaction and order IDs
- statement reference
- description or narrative
- payer/payee name and phone
- masked counterparty account
- fee and withholding
- currency

Rows with invalid dates, currency, direction or amounts are rejected with their statement line number.

## Matching behavior

Suggestions use deterministic evidence:

- invoice or bill number in transaction reference
- customer or supplier reference
- amount within configured tolerance
- transaction date within configured tolerance
- customer phone or counterparty name

Suggestions do not create payments or journals. Human confirmation remains mandatory.
