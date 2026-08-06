# Reconciliation callback production release

This release marker triggers a clean Vercel production deployment after merging PR #18.

Included production scope:

- bank, Telebirr and Safaricom M-Pesa reconciliation from PR #17
- secure CSV/TSV statement import and duplicate detection
- deterministic invoice and supplier-bill match suggestions
- partial allocations, fees, withholding, suspense and reversals
- token-protected provider callback adapters
- exact auth-proxy exceptions for Telebirr and M-Pesa callbacks from PR #18
- regression protection against wildcard reconciliation API exemptions

Production must be verified by exact commit SHA, custom-domain aliases, health endpoint, callback handler reachability and runtime logs.
