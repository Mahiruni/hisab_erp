# HisabTech Authentication Deployment

This file confirms that the authentication implementation is committed to the `main` branch.

## Live authentication routes

- `/auth/login`
- `/auth/sign-up`
- `/auth/email-login`
- `/auth/email-sign-up`
- `/auth/verify-email`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/magic-link`
- `/auth/invalid-link`

## Authentication authority

HisabTech continues to use Supabase Auth as the single identity and session authority because the existing PostgreSQL Row Level Security policies rely on Supabase JWT claims and `auth.uid()`.

## Google OAuth callback

Google OAuth is handled by Supabase Auth and uses:

`https://amwpbnczylbarqqcprev.supabase.co/auth/v1/callback`

HisabTech uses `/auth/callback` only as its application callback and validated internal redirect handler.

## Database changes

The authentication migrations are additive and include:

- authentication session registry
- login attempt records
- immutable authentication audit events
- hashed recovery code storage
- business invitations
- active business membership support
- `manager` and `staff` organization roles
- hardened execution permissions for privileged Supabase functions

No existing production tables or user data were removed.
