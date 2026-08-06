# HisabERP business email authentication setup

The application code supports email/password sign-up, verified email sign-in, magic links, password recovery, resend confirmation, and cookie-based Supabase SSR sessions.

## 1. Supabase URL configuration

In the HisabERP Supabase project, open **Authentication → URL Configuration**.

Set the production Site URL to:

```text
https://www.hisabtech.com
```

Add these exact redirect URLs:

```text
https://www.hisabtech.com/auth/confirm
https://hisabtech.com/auth/confirm
https://www.hisabtech.com/auth/callback
https://hisabtech.com/auth/callback
```

Add preview or local redirect URLs only for environments that are actively used and trusted.

## 2. Email provider

In **Authentication → Providers → Email**:

- Enable email/password authentication.
- Require email confirmation for new accounts.
- Keep secure email-change confirmation enabled.
- Use a reasonable OTP and verification-link expiration.

## 3. Production SMTP

The built-in Supabase sender is intended for testing and is rate-limited. Configure a custom SMTP provider before onboarding production customers.

Recommended sender identity:

```text
From name: HisabTech
From address: no-reply@hisabtech.com
Reply-to: support@hisabtech.com
```

Authenticate the sending domain with SPF, DKIM, and DMARC through the selected email provider.

## 4. Email templates

The app passes a trusted `/auth/confirm?next=...` URL through `RedirectTo`. The templates append a single-use token hash to that URL.

### Confirm signup

```html
<h2>Confirm your HisabTech account</h2>
<p>Verify this business email to continue company setup.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Confirm business email</a></p>
<p>If you did not create this account, ignore this message.</p>
```

### Magic link

```html
<h2>Sign in to HisabTech</h2>
<p>Use this single-use link to sign in.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Sign in securely</a></p>
<p>If you did not request this link, ignore this message.</p>
```

### Reset password

```html
<h2>Reset your HisabTech password</h2>
<p>Use this single-use link to choose a new password.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Reset password</a></p>
<p>If you did not request a password reset, ignore this message.</p>
```

## 5. Required Vercel environment variables

```text
NEXT_PUBLIC_APP_URL=https://www.hisabtech.com
NEXT_PUBLIC_SUPABASE_URL=https://<hisab-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Never expose a Supabase secret key or service-role key through a `NEXT_PUBLIC_` variable.

## 6. Acceptance test

Use a real inbox and verify this full sequence:

1. Create an account with email and password.
2. Receive the confirmation email.
3. Open the confirmation link and reach `/onboarding` with a valid session.
4. Sign out and sign in with the same credentials.
5. Request a password reset.
6. Open the recovery link, set a new password, and confirm all sessions are signed out.
7. Sign in with the new password.
8. Request a magic link for the existing account and confirm it signs in without creating a new account.
9. Request confirmation resend and confirm the response does not reveal whether an account exists.
