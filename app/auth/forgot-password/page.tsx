import Link from "next/link";
import { AuthNotice, EmailAuthCard } from "../../../components/email-auth-card";
import { requestPasswordReset } from "../../../lib/actions/email-auth";
import { isSupabaseConfigured } from "../../../lib/config";
import { safeNextPath } from "../../../lib/validation";

export const metadata = { title: "Create or reset password" };

type ForgotPasswordSearchParams = {
  error?: string;
  message?: string;
  email?: string;
  next?: string;
  preview?: string;
};

export default async function Page({ searchParams }: { searchParams: Promise<ForgotPasswordSearchParams> }) {
  const p = await searchParams;
  const configured = isSupabaseConfigured();
  const next = safeNextPath(p.next || "/");
  const email = typeof p.email === "string" ? p.email.trim().slice(0, 254) : "";
  const loginQuery = new URLSearchParams({ next });
  if (p.preview === "1") loginQuery.set("preview", "1");
  if (email) loginQuery.set("email", email);

  return (
    <EmailAuthCard
      title="Create or reset your password"
      description="Enter your email to receive a secure recovery link. This also lets an account originally created with Google add email-and-password access without creating a duplicate account."
      footer={<Link href={`/auth/login?${loginQuery.toString()}`}>Back to sign in</Link>}
      eyebrow="Secure account recovery"
      badge="Private response · expiring link"
      showcaseTitle="Recover access without losing your business workspace."
      showcaseDescription="Use one verified identity across Google, secure email links and email-password sign-in."
    >
      {!configured ? <AuthNotice type="warning">Authentication is not configured.</AuthNotice> : null}
      <AuthNotice type="error">{p.error}</AuthNotice>
      <AuthNotice type="success">{p.message}</AuthNotice>
      <AuthNotice type="warning">
        For privacy, HisabTech shows the same response whether or not an account exists for the address.
      </AuthNotice>

      <form action={requestPasswordReset} className="auth-standard-form">
        <input type="hidden" name="next" value={next} />
        <label className="auth-standard-field" htmlFor="recovery-email">
          <span>Business email</span>
          <input
            id="recovery-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@company.com"
            defaultValue={email}
            required
            autoFocus
          />
        </label>
        <button className="auth-standard-primary" type="submit" disabled={!configured}>
          <span>Send secure recovery link</span><b aria-hidden="true">→</b>
        </button>
      </form>
    </EmailAuthCard>
  );
}
