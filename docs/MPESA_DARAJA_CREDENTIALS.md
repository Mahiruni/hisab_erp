# Safaricom M-Pesa Daraja credentials

## Purpose

HisabERP stores each organization's Safaricom Daraja Consumer Key and Consumer Secret in Supabase Vault. The credentials are used only by server-side code to request a short-lived OAuth access token.

The OAuth validation flow does not initiate, reverse, query or settle any payment.

## Access controls

- Only an organization owner or administrator with an AAL2 authenticator session can save or replace credentials.
- Credentials are encrypted in Supabase Vault under organization-scoped names.
- The Consumer Secret is never returned to the browser after saving.
- Status views expose only the selected environment, the last four Consumer Key characters and connection-check evidence.
- Only the Supabase service role can decrypt the key pair for OAuth.
- Every save and validation attempt creates an audit event.

## Configure from HisabERP

1. Sign in as an owner or administrator.
2. Complete authenticator MFA so the session reaches AAL2.
3. Open **Bank and payment reconciliation**.
4. Locate **Safaricom M-Pesa Daraja connection**.
5. Choose `sandbox` or `production` according to the Daraja application that issued the credentials.
6. Enter the Consumer Key and Consumer Secret.
7. Select **Encrypt and save Daraja credentials**.
8. Select **Validate OAuth connection**.

A successful validation means Safaricom issued a short-lived OAuth access token. HisabERP discards that token after the check and stores only the result, HTTP status, provider response code and timestamp.

## Callback isolation

The Consumer Secret is never used as a callback credential. HisabERP generates a separate organization-scoped callback token when the Daraja credentials are first stored.

The existing `MPESA_CALLBACK_TOKEN` server environment variable remains supported as a global fallback for older deployments. When it is absent, the M-Pesa callback handler resolves the organization-specific Vault token from the active reconciliation source.

## Additional information still required for payment initiation

OAuth authentication alone does not enable an M-Pesa payment flow. STK Push, C2B, B2C, reversals and transaction-status requests require the approved API product and its corresponding business values, which may include:

- Paybill, till or business shortcode
- Lipa na M-Pesa passkey for STK Push
- Approved callback/result/timeout URLs
- Product-specific initiator credentials or security credential
- Sandbox test numbers and production approval

HisabERP must not invent these values or treat sandbox credentials as production credentials.

## Rotation

Saving a new Consumer Key and Consumer Secret replaces the encrypted pair. Existing callback protection remains separate. Rotate credentials immediately in the Safaricom developer portal whenever a key pair is suspected to have been exposed, then replace it in HisabERP and re-run OAuth validation.
