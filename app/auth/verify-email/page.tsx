import Link from "next/link";
import { AuthNotice, EmailAuthCard } from "../../../components/email-auth-card";
import { resendEmailConfirmation } from "../../../lib/actions/email-auth";
import { safeNextPath } from "../../../lib/validation";

export const metadata = { title: "Verify email" };

export default async function Page({ searchParams }: { searchParams: Promise<{ email?: string; error?: string; message?: string; next?: string }> }) {
  const { email, error, message, next: requestedNext } = await searchParams;
  const next = safeNextPath(requestedNext || "/onboarding");

  return (
    <EmailAuthCard
      title="Check your email"
      description="Open the single-use verification link to confirm your business identity and continue securely to your selected plan or company setup."
      footer={<Link href={`/auth/login?next=${encodeURIComponent(next)}`}>Return to sign in</Link>}
      eyebrow="Verify your business identity"
      badge="Single-use email verification"
      showcaseTitle="Your next step is protected and remembered."
      showcaseDescription="Verification confirms ownership of your business email before Hisab creates a workspace or begins paid activation."
    >
      <AuthNotice type="error">{error}</AuthNotice>
      <AuthNotice type="success">{message}</AuthNotice>
      {!message ? (
        <div className="form-alert success" role="status">
          If this address can be registered, a verification message was sent{email ? ` to ${email}` : ""}.
        </div>
      ) : null}

      <div className="auth-verification-steps" aria-label="Verification progress">
        <span className="complete"><b>1</b><small>Account details received</small></span>
        <span className="current"><b>2</b><small>Verify your email</small></span>
        <span><b>3</b><small>Continue securely</small></span>
      </div>

      {email ? (
        <form action={resendEmailConfirmation} className="auth-standard-form auth-verification-resend">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <button className="auth-standard-primary" type="submit"><span>Resend verification email</span><b aria-hidden="true">→</b></button>
        </form>
      ) : null}

      <p className="auth-legal-note">The link is single-use. Check spam or junk folders before requesting another verification message.</p>
    </EmailAuthCard>
  );
}
